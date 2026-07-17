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
import { verifyGoogleAccessToken } from "../../infrastructure/google-auth.service";
import { notifyAdmins } from "../../infrastructure/notification.service";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isDomainAllowed(email: string): boolean {
  if (config.auth.allowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return config.auth.allowedDomains.some(d => domain === d || domain?.endsWith("." + d));
}

// All 6 roles are available for self-service registration. The 4 privileged
// ones (researcher, archivist, librarian, admin) don't get real access until
// an existing admin approves them — see APPROVAL_REQUIRED_ROLES below.
export const SELF_SERVICE_ROLES = ["member", "student_author", "researcher", "archivist", "librarian", "admin"];
export const APPROVAL_REQUIRED_ROLES = ["researcher", "archivist", "librarian", "admin"];

function roleLabel(role: string): string {
  return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const router = Router();

// Single source of truth for password strength — reused wherever a user sets or
// changes their password (registration, change-password, reset-password) so the
// rule can't be weakened by going through a different endpoint.
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
const PASSWORD_STRENGTH_MESSAGE = "Password must be 8+ chars with uppercase, lowercase, digit, and special char";

function passwordStrengthValidation(field: string) {
  return body(field)
    .isLength({ min: 8 })
    .matches(PASSWORD_STRENGTH_REGEX)
    .withMessage(PASSWORD_STRENGTH_MESSAGE);
}

export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().toLowerCase().withMessage("Valid email required"),
  passwordStrengthValidation("password"),
  body("department").optional().trim(),
  body("role").optional().isIn(SELF_SERVICE_ROLES)
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

  const existing = await queryOne<{ user_id: string; role: string; email_verified: boolean; membership_status: string; password_hash: string | null }>(
    "SELECT user_id, role, email_verified, membership_status, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email]
  );
  if (existing) {
    if (!existing.email_verified) {
      throw new AppError(409, "Email already registered but not verified. Use resend-verification to get a new code.");
    }

    // A role-switch request rewrites this account's membership_status and fires an
    // admin notification — must prove ownership of the account with its real password
    // first, or anyone could file a bogus escalation request against any known email.
    if (!existing.password_hash || !(await bcrypt.compare(password, existing.password_hash))) {
      throw new AppError(409, "Email already registered.");
    }

    const assignedRole = role && SELF_SERVICE_ROLES.includes(role) ? role : "member";
    if (assignedRole === existing.role) {
      throw new AppError(409, "Email already registered.");
    }

    // Request role change with admin approval
    await query(
      "UPDATE users SET requested_role = $1, membership_status = 'pending_approval', updated_at = NOW() WHERE user_id = $2",
      [assignedRole, existing.user_id]
    );

    void notifyAdmins({
      type: "pending_approval",
      title: "Role Switch Requested",
      message: `${name} (${email}) requested to switch their role from ${roleLabel(existing.role)} to ${roleLabel(assignedRole)} and is awaiting approval.`,
      action_url: "/admin?tab=users",
    });

    res.json({
      success: true,
      data: {
        pendingApproval: true,
        message: `Your request to switch your role to ${roleLabel(assignedRole)} is pending admin approval.`,
      },
    });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const assignedRole = role && SELF_SERVICE_ROLES.includes(role) ? role : "member";

  // Everyone starts unverified; the pending_approval branch (for privileged
  // roles) happens at verify time.
  const initialStatus = "pending_verification";

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
    html: verificationOtpEmail(name, otp, config.auth.otpExpiryMinutes, "verify"),
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

    // Privileged roles (researcher, archivist, librarian, admin) go into
    // pending_approval; member/student_author become active immediately.
    const newStatus = APPROVAL_REQUIRED_ROLES.includes(user.role) ? "pending_approval" : "active";

    await query(
      `UPDATE users SET email_verified = TRUE, membership_status = $1,
          verification_otp = NULL, verification_otp_expires = NULL
       WHERE user_id = $2`,
      [newStatus, user.user_id]
    );

    logger.info("Email verified", { user_id: user.user_id, role: user.role, newStatus });

    if (newStatus === "pending_approval") {
      // Fire-and-forget — notifyAdmins never rejects, it logs internally.
      void notifyAdmins({
        type: "pending_approval",
        title: "New Registration Pending Approval",
        message: `${user.name} (${user.email}) registered as ${roleLabel(user.role)} and is awaiting approval.`,
        action_url: "/admin?tab=users",
      });

      return res.json({
        success: true,
        data: {
          pendingApproval: true,
          role: user.role,
          message: `Your email is verified. Your ${roleLabel(user.role)} account is now pending admin approval. You will receive an email once approved.`,
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
      html: verificationOtpEmail(user.name, otp, config.auth.otpExpiryMinutes, "verify"),
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

    if (user.membership_status === "inactive") {
      throw new AppError(403, "Account deactivated. Contact administrator.");
    }

    if (user.membership_status === "pending_verification") {
      throw new AppError(403, "Email not verified. Please verify your email with the code we sent you.");
    }

    if (user.membership_status === "pending_approval") {
      throw new AppError(403, "Your account is pending admin approval. You will receive an email once approved.");
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

  // Re-check account standing so suspension/deactivation takes effect on next refresh
  const account = await queryOne<{ membership_status: string; role: string }>(
    "SELECT membership_status, role FROM users WHERE user_id = $1 AND deleted_at IS NULL",
    [payload.user_id]
  );
  if (!account || account.membership_status !== "active") {
    await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    throw new AppError(403, "Account is not active. Contact administrator.");
  }

  const tokens = generateTokens(payload.user_id, payload.email, account.role as never);
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

// GET /api/auth/advisors — public list of researchers (faculty/advisors), optionally scoped by department
router.get("/advisors", asyncHandler(async (req: Request, res: Response) => {
  const { department } = req.query as { department?: string };
  const advisors = department
    ? await query(
        `SELECT user_id, name, department
         FROM users
         WHERE role = 'researcher' AND deleted_at IS NULL AND department = $1
         ORDER BY name ASC`,
        [department]
      )
    : await query(
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
    `SELECT user_id, name, email, role, requested_role, department, bio, avatar_url, membership_status, created_at
     FROM users WHERE user_id = $1`,
    [req.user!.user_id]
  );
  res.json({ success: true, data: user });
}));

// PATCH /api/auth/me — self-service profile edits: bio and avatar (FR-046).
// avatar_url stores a data: URL directly (no S3 wiring for this yet) — the
// frontend caps uploads at 2MB client-side; this enforces the same limit
// server-side so a modified client can't bypass it.
const MAX_AVATAR_DATA_URL_LENGTH = 3 * 1024 * 1024; // ~2MB image, base64-inflated (~4/3x)
router.patch(
  "/me",
  authenticate,
  [
    body("bio").optional({ values: "null" }).isString().isLength({ max: 500 }).withMessage("Bio must be 500 characters or fewer"),
    body("avatar_url").optional({ values: "null" }).isString().withMessage("Invalid avatar"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { bio, avatar_url } = req.body as { bio?: string | null; avatar_url?: string | null };

    if (avatar_url && avatar_url.length > MAX_AVATAR_DATA_URL_LENGTH) {
      throw new AppError(400, "Avatar image is too large");
    }
    if (avatar_url && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatar_url)) {
      throw new AppError(400, "Avatar must be a PNG, JPEG, WebP, or GIF image");
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (bio !== undefined) { updates.push(`bio = $${idx++}`); params.push(bio); }
    if (avatar_url !== undefined) { updates.push(`avatar_url = $${idx++}`); params.push(avatar_url); }

    if (updates.length === 0) {
      throw new AppError(400, "No fields to update");
    }

    params.push(req.user!.user_id);
    const user = await queryOne(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW()
       WHERE user_id = $${idx}
       RETURNING user_id, name, email, role, department, bio, avatar_url, membership_status, created_at`,
      params
    );

    res.json({ success: true, data: user });
  })
);

// POST /api/auth/me/deactivate — self-service account deactivation (FR-049).
// Distinct from the admin PUT /admin/users/:id endpoint, which deliberately
// blocks an admin from deactivating themselves via that route — this route
// is the intended path for a user closing their own account. Data is
// retained (soft-deactivate via membership_status, not deleted); an admin
// can reactivate from the Users panel.
router.post("/me/deactivate", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.user_id;

  const existingUser = await queryOne<{ role: string }>(
    "SELECT role FROM users WHERE user_id = $1", [userId]
  );
  if (!existingUser) throw new AppError(404, "User not found");

  if (existingUser.role === "admin") {
    const [{ count: activeAdminCount }] = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND membership_status = 'active' AND deleted_at IS NULL"
    );
    if (parseInt(activeAdminCount) <= 1) {
      throw new AppError(400, "You are the last active admin account and cannot deactivate yourself. Promote another admin first.");
    }
  }

  await query(
    "UPDATE users SET membership_status = 'inactive', updated_at = NOW() WHERE user_id = $1",
    [userId]
  );
  // Revoke all refresh tokens so the account can't be silently kept alive —
  // the current access token still expires naturally within its own TTL.
  await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);

  logger.info("User deactivated own account", { user_id: userId });

  res.json({ success: true, message: "Your account has been deactivated." });
}));

// GET /api/auth/me/activity — unified per-user activity feed (FR-048):
// downloads/uploads/submissions/comments merged and sorted chronologically,
// as distinct from the site-wide "recent activity" feed on the dashboard.
router.get("/me/activity", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.user_id;

  const rows = await query<{
    entry_type: string; title: string; ref_id: string; happened_at: string;
  }>(
    `(SELECT 'archive_upload' as entry_type, title_en as title, item_id::text as ref_id, created_at as happened_at
      FROM archive_items WHERE uploaded_by = $1)
     UNION ALL
     (SELECT 'research_upload', title, output_id::text, created_at
      FROM research_outputs WHERE uploaded_by = $1)
     UNION ALL
     (SELECT 'showcase_submission', title, project_id::text, created_at
      FROM student_projects WHERE submitted_by = $1)
     UNION ALL
     (SELECT 'borrow', ci.title, b.id::text, b.issue_date::timestamptz
      FROM borrows b JOIN catalog_items ci ON ci.catalog_id = b.resource_id
      WHERE b.user_id = $1)
     UNION ALL
     (SELECT 'comment', LEFT(content, 80), comment_id::text, created_at
      FROM comments WHERE user_id = $1)
     ORDER BY happened_at DESC
     LIMIT 100`,
    [userId]
  );

  res.json({ success: true, data: rows });
}));

// GET /api/auth/me/export — full personal-data export as JSON (FR-047).
// Distinct from the frontend's client-side PDF, which only formats data
// already in the page's local state — this endpoint is the actual
// server-side source of truth for a GDPR-style data export request.
router.get("/me/export", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.user_id;

  const [profile, archiveUploads, researchUploads, showcaseSubmissions, borrowHistory, comments, notifications] = await Promise.all([
    queryOne(
      `SELECT user_id, name, email, role, department, bio, membership_status, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    ),
    query(
      `SELECT item_id, title_en, category, access_tier, status, created_at
       FROM archive_items WHERE uploaded_by = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    query(
      `SELECT output_id, title, output_type, status, created_at
       FROM research_outputs WHERE uploaded_by = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    query(
      `SELECT project_id, title, status, created_at
       FROM student_projects WHERE submitted_by = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    query(
      `SELECT b.id, ci.title, b.issue_date, b.due_date, b.return_date, b.borrow_status
       FROM borrows b JOIN catalog_items ci ON ci.catalog_id = b.resource_id
       WHERE b.user_id = $1 ORDER BY b.issue_date DESC`,
      [userId]
    ),
    query(
      `SELECT comment_id, entity_type, entity_id, content, created_at
       FROM comments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    query(
      `SELECT type, title, message, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [userId]
    ),
  ]);

  res.json({
    success: true,
    data: {
      exported_at: new Date().toISOString(),
      profile,
      archive_uploads: archiveUploads,
      research_uploads: researchUploads,
      showcase_submissions: showcaseSubmissions,
      borrow_history: borrowHistory,
      comments,
      notifications,
    },
  });
}));

// POST /api/auth/me/role-request — self-service request to switch roles,
// requires admin approval (same review flow as a signup role request).
router.post(
  "/me/role-request",
  authenticate,
  [
    body("role").isIn(SELF_SERVICE_ROLES).withMessage("Invalid role selected"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { role: requestedRole } = req.body as { role: string };
    const userId = req.user!.user_id;

    const existing = await queryOne<{ name: string; email: string; role: string; membership_status: string }>(
      "SELECT name, email, role, membership_status FROM users WHERE user_id = $1",
      [userId]
    );
    if (!existing) throw new AppError(404, "User not found");

    if (existing.membership_status === "pending_approval") {
      throw new AppError(409, "You already have a role change request awaiting admin approval");
    }
    if (requestedRole === existing.role) {
      throw new AppError(400, "You already have this role");
    }

    await query(
      "UPDATE users SET requested_role = $1, membership_status = 'pending_approval', updated_at = NOW() WHERE user_id = $2",
      [requestedRole, userId]
    );

    void notifyAdmins({
      type: "pending_approval",
      title: "Role Switch Requested",
      message: `${existing.name} (${existing.email}) requested to switch their role from ${roleLabel(existing.role)} to ${roleLabel(requestedRole)} and is awaiting approval.`,
      action_url: "/admin?tab=users",
    });

    res.json({
      success: true,
      data: {
        pendingApproval: true,
        message: `Your request to switch your role to ${roleLabel(requestedRole)} is pending admin approval.`,
      },
    });
  })
);

// POST /api/auth/oauth-login
router.post(
  "/oauth-login",
  [
    // provider is intentionally restricted to "google" — there is no real
    // institutional SSO integration yet, so accepting a provider we can't
    // independently verify would defeat the point of this endpoint.
    body("provider").equals("google").withMessage("Unsupported OAuth provider"),
    body("accessToken").trim().notEmpty().withMessage("Google access token is required"),
    body("role").isIn(SELF_SERVICE_ROLES).withMessage("Invalid role selected").optional({ values: "falsy" }),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { accessToken, role, department } = req.body as {
      accessToken: string;
      role: string;
      department?: string;
    };
    const provider = "google";

    // Never trust client-submitted email/name/providerId for OAuth — verify
    // the access token with Google and use ITS claims as the source of truth.
    let verified: { email: string; name: string; googleId: string };
    try {
      verified = await verifyGoogleAccessToken(accessToken);
    } catch (err) {
      throw new AppError(401, (err as Error).message || "Google sign-in verification failed");
    }
    const { email, name, googleId: providerId } = verified;

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
      // Returning user — this is a plain sign-in. Any `role` the client sends here is
      // intentionally ignored: this used to be compared against the stored role and,
      // on a mismatch, silently filed a "role switch request" that emailed admins.
      // The sign-in role picker defaults to "member" and doesn't show the account's
      // actual role, so any returning user who forgot which role they picked, or
      // just clicked the wrong option, would accidentally fire off a real request —
      // flooding admins with notifications nobody meant to send. A deliberate role
      // change should go through its own explicit action, not ordinary sign-in.
      if (user.membership_status === "suspended") {
        throw new AppError(403, "Account suspended. Contact administrator.");
      }

      if (user.membership_status === "inactive") {
        throw new AppError(403, "Account deactivated. Contact administrator.");
      }

      if (user.membership_status === "pending_approval") {
        throw new AppError(403, "Your account is pending admin approval. You will receive an email once approved.");
      }

      // The OAuth provider vouches for the email, so a password-registered account
      // stuck in pending_verification can be promoted here — except privileged
      // roles, which still require admin approval.
      if (user.membership_status === "pending_verification") {
        const promotedStatus = APPROVAL_REQUIRED_ROLES.includes(user.role) ? "pending_approval" : "active";
        await query(
          "UPDATE users SET email_verified = TRUE, membership_status = $1 WHERE user_id = $2",
          [promotedStatus, user.user_id]
        );
        if (promotedStatus === "pending_approval") {
          void notifyAdmins({
            type: "pending_approval",
            title: "New Registration Pending Approval",
            message: `${user.name} (${user.email}) registered as ${roleLabel(user.role)} and is awaiting approval.`,
            action_url: "/admin?tab=users",
          });
          throw new AppError(403, `Your email is verified. Your ${roleLabel(user.role)} account is now pending admin approval.`);
        }
        user.membership_status = promotedStatus;
      }

      await query(
        "UPDATE users SET oauth_provider = $1, oauth_id = $2, name = $3 WHERE user_id = $4",
        [provider, providerId, name, user.user_id]
      );
    } else {
      // Brand-new account. If the client hasn't told us which role to create it as
      // yet, don't guess (and don't create anything) — signal back so the frontend
      // can ask, then retry this same call with `role` set once the person picks one.
      if (!role) {
        res.json({ success: true, data: { requiresRole: true, name, email } });
        return;
      }

      // New OAuth signups follow the same rules as password registration:
      // institutional domain restriction, and privileged roles await admin approval.
      if (!isDomainAllowed(email)) {
        throw new AppError(403, "Registration is restricted to institutional email addresses.");
      }

      const newUserRole = SELF_SERVICE_ROLES.includes(role) ? role : "member";
      const newUserStatus = APPROVAL_REQUIRED_ROLES.includes(newUserRole) ? "pending_approval" : "active";

      user = await queryOne<{
        user_id: string;
        name: string;
        email: string;
        role: string;
        membership_status: string;
        oauth_provider: string;
        oauth_id: string;
      }>(
        `INSERT INTO users (name, email, role, oauth_provider, oauth_id, department, membership_status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING user_id, name, email, role, membership_status, oauth_provider, oauth_id`,
        [name, email, newUserRole, provider, providerId, department ?? null, newUserStatus]
      );

      if (newUserStatus === "pending_approval") {
        void notifyAdmins({
          type: "pending_approval",
          title: "New Registration Pending Approval",
          message: `${name} (${email}) registered as ${roleLabel(newUserRole)} and is awaiting approval.`,
          action_url: "/admin?tab=users",
        });
        throw new AppError(403, `Your ${roleLabel(newUserRole)} account has been created and is pending admin approval. You will receive an email once approved.`);
      }
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

// POST /api/auth/change-password — authenticated password update
router.post(
  "/change-password",
  authenticate,
  [
    body("old_password").notEmpty().withMessage("Current password is required"),
    passwordStrengthValidation("new_password"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { old_password, new_password } = req.body as { old_password: string; new_password: string };

    const user = await queryOne<{ password_hash: string | null }>(
      "SELECT password_hash FROM users WHERE user_id = $1 AND deleted_at IS NULL",
      [req.user!.user_id]
    );
    if (!user) throw new AppError(404, "Account not found");
    if (!user.password_hash) throw new AppError(400, "This account uses OAuth sign-in and has no password.");

    if (!(await bcrypt.compare(old_password, user.password_hash))) {
      throw new AppError(401, "Current password is incorrect");
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [password_hash, req.user!.user_id]);

    // Revoke all refresh tokens so stolen sessions die with the old password
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [req.user!.user_id]);

    logger.info("Password changed", { user_id: req.user!.user_id });
    res.json({ success: true, data: { message: "Password updated. Please sign in again on other devices." } });
  })
);

// POST /api/auth/forgot-password — sends a reset code (reuses the OTP columns)
router.post(
  "/forgot-password",
  [body("email").isEmail().toLowerCase()],
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const user = await queryOne<{ user_id: string; name: string; password_hash: string | null }>(
      "SELECT user_id, name, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
    );

    if (!user) {
      throw new AppError(404, "No account found with that email address.");
    }
    if (!user.password_hash) {
      throw new AppError(400, "This account signed up with Google. Sign in with Google instead — there's no password to reset.");
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + config.auth.otpExpiryMinutes * 60 * 1000);
    await query(
      "UPDATE users SET verification_otp = $1, verification_otp_expires = $2 WHERE user_id = $3",
      [otp, otpExpires, user.user_id]
    );
    await sendEmail({
      to: email,
      subject: "Your DKP password reset code",
      html: verificationOtpEmail(user.name, otp, config.auth.otpExpiryMinutes, "reset"),
    });

    res.json({ success: true, data: { message: "A reset code has been sent to your email." } });
  })
);

// POST /api/auth/reset-password — completes the reset with the emailed code
router.post(
  "/reset-password",
  [
    body("email").isEmail().toLowerCase(),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Reset code must be a 6-digit number"),
    passwordStrengthValidation("new_password"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, otp, new_password } = req.body as { email: string; otp: string; new_password: string };

    const user = await queryOne<{
      user_id: string; verification_otp: string | null; verification_otp_expires: string | null;
    }>(
      "SELECT user_id, verification_otp, verification_otp_expires FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email]
    );

    if (!user || !user.verification_otp || user.verification_otp !== otp) {
      throw new AppError(400, "Invalid reset code.");
    }
    if (!user.verification_otp_expires || new Date(user.verification_otp_expires) < new Date()) {
      throw new AppError(400, "Reset code has expired. Please request a new one.");
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await query(
      `UPDATE users SET password_hash = $1, verification_otp = NULL, verification_otp_expires = NULL
       WHERE user_id = $2`,
      [password_hash, user.user_id]
    );
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.user_id]);

    logger.info("Password reset completed", { user_id: user.user_id });
    res.json({ success: true, data: { message: "Password reset. You can now sign in with your new password." } });
  })
);

// GET /api/auth/profile/:id — requires login so emails can't be harvested anonymously
router.get("/profile/:id", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await queryOne(
    `SELECT user_id, name, email, role, department, bio, avatar_url, membership_status, created_at
     FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
    [req.params.id]
  );
  if (!user) throw new AppError(404, "User profile not found");
  res.json({ success: true, data: user });
}));

export default router;
