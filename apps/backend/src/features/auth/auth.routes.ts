import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { query, queryOne } from "../../core/db/pool";
import { config } from "../../core/config";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { AppError, asyncHandler } from "../../core/middleware/error.middleware";
import { logger } from "../../core/config/logger";
import { sendEmail, verificationOtpEmail, accountApprovalEmail } from "../../infrastructure/email.service";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isDomainAllowed(email: string): boolean {
  if (config.auth.allowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return config.auth.allowedDomains.some(d => domain === d || domain?.endsWith("." + d));
}

const router = Router();

export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().toLowerCase().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must be 8+ chars with uppercase, lowercase, digit, and special char"),
  body("department").optional().trim(),
  body("role").optional().isIn(["member", "student_author", "researcher"])
    .withMessage("Invalid role selected"),
];

// POST /api/auth/register
router.post("/register", registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { name, email, password, department, role } = req.body as {
    name: string; email: string; password: string; department?: string; role?: string;
  };

  // Institutional email check
  if (!isDomainAllowed(email)) {
    throw new AppError(400, `Registration is restricted to institutional email addresses (e.g. @du.ac.bd). Please use your university email.`);
  }

  const existing = await queryOne<{ email_verified: boolean; membership_status: string }>(
    "SELECT email_verified, membership_status FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email]
  );
  if (existing) {
    if (!existing.email_verified) {
      throw new AppError(409, "Email already registered but not verified. Use resend-verification to get a new code.");
    }
    throw new AppError(409, "Email already registered.");
  }

  const password_hash = await bcrypt.hash(password, 12);
  const allowedRoles = ["member", "student_author", "researcher"];
  const assignedRole = role && allowedRoles.includes(role) ? role : "member";

  // Researchers need admin approval after email verification; others activate immediately.
  const initialStatus = assignedRole === "researcher" ? "pending_verification" : "pending_verification";

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + config.auth.otpExpiryMinutes * 60 * 1000);

  const user = await queryOne<{ user_id: string; name: string; email: string; role: string }>(
    `INSERT INTO users (name, email, password_hash, department, role, membership_status, email_verified, verification_otp, verification_otp_expires)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8)
     RETURNING user_id, name, email, role`,
    [name, email, password_hash, department ?? null, assignedRole, initialStatus, otp, otpExpires]
  );

  await sendEmail({
    to: email,
    subject: "Verify your DKP account",
    html: verificationOtpEmail(name, otp, config.auth.otpExpiryMinutes),
  });

  logger.info("User registered — awaiting verification", { user_id: user!.user_id, email, role: assignedRole });
  res.status(201).json({
    success: true,
    data: {
      requiresVerification: true,
      email,
      role: assignedRole,
      message: `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
    },
  });
}));

// POST /api/auth/verify-email
router.post(
  "/verify-email",
  [
    body("email").isEmail().toLowerCase(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric().withMessage("OTP must be a 6-digit code"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, otp } = req.body as { email: string; otp: string };

    const user = await queryOne<{
      user_id: string; name: string; email: string; role: string;
      membership_status: string; email_verified: boolean;
      verification_otp: string | null; verification_otp_expires: string | null;
    }>(
      `SELECT user_id, name, email, role, membership_status, email_verified,
              verification_otp, verification_otp_expires
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (!user) throw new AppError(404, "Account not found.");
    if (user.email_verified) throw new AppError(400, "Email is already verified.");
    if (!user.verification_otp || user.verification_otp !== otp) throw new AppError(400, "Invalid verification code.");
    if (!user.verification_otp_expires || new Date(user.verification_otp_expires) < new Date()) {
      throw new AppError(400, "Verification code has expired. Please request a new one.");
    }

    // Researchers go into pending_approval; member/student_author become active immediately.
    const newStatus = user.role === "researcher" ? "pending_approval" : "active";

    await query(
      `UPDATE users SET email_verified = TRUE, membership_status = $1,
          verification_otp = NULL, verification_otp_expires = NULL
       WHERE user_id = $2`,
      [newStatus, user.user_id]
    );

    logger.info("Email verified", { user_id: user.user_id, role: user.role, newStatus });

    if (newStatus === "pending_approval") {
      return res.json({
        success: true,
        data: {
          pendingApproval: true,
          message: "Your email is verified. Your Researcher account is now pending admin approval. You will receive an email once approved.",
        },
      });
    }

    // member / student_author — issue tokens immediately
    const tokens = generateTokens(user.user_id, user.email, user.role as never);
    await storeRefreshToken(user.user_id, tokens.refresh_token);
    const fullUser = await queryOne(
      "SELECT user_id, name, email, role, department, membership_status, created_at FROM users WHERE user_id = $1",
      [user.user_id]
    );
    return res.json({ success: true, data: { ...tokens, user: fullUser } });
  })
);

// POST /api/auth/resend-verification
router.post(
  "/resend-verification",
  [body("email").isEmail().toLowerCase()],
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const user = await queryOne<{ user_id: string; name: string; email_verified: boolean; membership_status: string }>(
      "SELECT user_id, name, email_verified, membership_status FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
    );

    // Always return 200 to avoid email enumeration
    if (!user || user.email_verified) {
      res.json({ success: true, data: { message: "If that email exists and is unverified, a new code has been sent." } });
      return;
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + config.auth.otpExpiryMinutes * 60 * 1000);

    await query(
      "UPDATE users SET verification_otp = $1, verification_otp_expires = $2 WHERE user_id = $3",
      [otp, otpExpires, user.user_id]
    );

    await sendEmail({
      to: email,
      subject: "Your new DKP verification code",
      html: verificationOtpEmail(user.name, otp, config.auth.otpExpiryMinutes),
    });

    res.json({ success: true, data: { message: "A new verification code has been sent to your email." } });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().toLowerCase(),
    body("password").notEmpty(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await queryOne<{
      user_id: string;
      name: string;
      email: string;
      role: string;
      password_hash: string;
      membership_status: string;
    }>(
      `SELECT user_id, name, email, role, password_hash, membership_status, department, avatar_url
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(401, "Invalid email or password");
    }

    if (user.membership_status === "suspended") {
      throw new AppError(403, "Account suspended. Contact administrator.");
    }

    const { password_hash: _, ...safeUser } = user;
    const tokens = generateTokens(user.user_id, user.email, user.role as never);
    await storeRefreshToken(user.user_id, tokens.refresh_token);

    logger.info("User logged in", { user_id: user.user_id });
    res.json({ success: true, data: { ...tokens, user: safeUser } });
  })
);

// POST /api/auth/refresh
router.post("/refresh", asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body as { refresh_token: string };
  if (!refresh_token) throw new AppError(400, "Refresh token required");

  let payload: { user_id: string; email: string; role: string };
  try {
    payload = jwt.verify(refresh_token, config.jwt.secret) as typeof payload;
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }

  const crypto = await import("crypto");
  const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");

  const stored = await queryOne(
    `SELECT token_id FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
    [payload.user_id, tokenHash]
  );

  if (!stored) throw new AppError(401, "Refresh token expired or revoked");

  const tokens = generateTokens(payload.user_id, payload.email, payload.role as never);
  await storeRefreshToken(payload.user_id, tokens.refresh_token);

  // Revoke old token
  await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);

  res.json({ success: true, data: tokens });
}));

// POST /api/auth/logout
router.post("/logout", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refresh_token } = req.body as { refresh_token?: string };
  if (refresh_token) {
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");
    await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
  }
  res.json({ success: true, message: "Logged out successfully" });
}));

// GET /api/auth/advisors — public list of all researchers (faculty/advisors)
router.get("/advisors", asyncHandler(async (_req: Request, res: Response) => {
  const advisors = await query(
    `SELECT user_id, name, department
     FROM users
     WHERE role = 'researcher' AND deleted_at IS NULL
     ORDER BY name ASC`
  );
  res.json({ success: true, data: advisors });
}));

// GET /api/auth/members/search — search members by name or email (librarian use)
router.get("/members/search", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q } = req.query as { q: string };
  if (!q?.trim()) { res.json({ success: true, data: [] }); return; }

  const members = await query(
    `SELECT user_id, name, email, department, membership_status
     FROM users
     WHERE deleted_at IS NULL
       AND membership_status = 'active'
       AND (name ILIKE $1 OR email ILIKE $1)
     ORDER BY name ASC
     LIMIT 10`,
    [`%${q.trim()}%`]
  );
  res.json({ success: true, data: members });
}));

// GET /api/auth/me
router.get("/me", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await queryOne(
    `SELECT user_id, name, email, role, department, bio, avatar_url, membership_status, created_at
     FROM users WHERE user_id = $1`,
    [req.user!.user_id]
  );
  res.json({ success: true, data: user });
}));

// POST /api/auth/oauth-login
router.post(
  "/oauth-login",
  [
    body("email").isEmail().toLowerCase().withMessage("Valid email required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("role").isIn(["member", "student_author", "researcher"]).withMessage("Self-service OAuth only allows non-privileged roles").optional({ values: "falsy" }),
    body("provider").isIn(["google", "sso"]),
    body("providerId").trim().notEmpty(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, name, role, provider, providerId, department } = req.body as {
      email: string;
      name: string;
      role: string;
      provider: string;
      providerId: string;
      department?: string;
    };

    // Check if user already exists
    let user = await queryOne<{
      user_id: string;
      name: string;
      email: string;
      role: string;
      membership_status: string;
      oauth_provider: string;
      oauth_id: string;
    }>(
      `SELECT user_id, name, email, role, membership_status, oauth_provider, oauth_id
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (user) {
      if (user.membership_status === "suspended") {
        throw new AppError(403, "Account suspended. Contact administrator.");
      }

      // Existing user: always use the DB-stored role, never the body role.
      // This allows admin/librarian/archivist accounts (created via /api/admin/users) to
      // authenticate via OAuth without needing to send privileged roles in the request body.
      await query(
        "UPDATE users SET oauth_provider = $1, oauth_id = $2, name = $3 WHERE user_id = $4",
        [provider, providerId, name, user.user_id]
      );
    } else {
      // New OAuth signups: body role is clamped to non-privileged roles only.
      // archivist/librarian/admin accounts must be created via POST /api/admin/users.
      const selfServiceRoles = ["member", "student_author", "researcher"];
      const newUserRole = selfServiceRoles.includes(role) ? role : "member";

      user = await queryOne<{
        user_id: string;
        name: string;
        email: string;
        role: string;
        membership_status: string;
        oauth_provider: string;
        oauth_id: string;
      }>(
        `INSERT INTO users (name, email, role, oauth_provider, oauth_id, department, membership_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         RETURNING user_id, name, email, role, membership_status, oauth_provider, oauth_id`,
        [name, email, newUserRole, provider, providerId, department ?? null]
      );
    }

    const tokens = generateTokens(user!.user_id, user!.email, user!.role as never);
    await storeRefreshToken(user!.user_id, tokens.refresh_token);

    logger.info("OAuth Login Successful", { user_id: user!.user_id, email, provider });
    res.json({ success: true, data: { ...tokens, user } });
  })
);

export function generateTokens(user_id: string, email: string, role: string) {
  const access_token = jwt.sign(
    { user_id, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions
  );
  const refresh_token = jwt.sign(
    { user_id, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
  return { access_token, refresh_token };
}

async function storeRefreshToken(user_id: string, token: string): Promise<void> {
  const crypto = await import("crypto");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user_id, tokenHash, expiresAt]
  );
}

export default router;
