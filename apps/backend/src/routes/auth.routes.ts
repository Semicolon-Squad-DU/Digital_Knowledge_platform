import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { query, queryOne } from "../db/pool";
import { config } from "../config";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { logger } from "../config/logger";

const router = Router();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must be 8+ chars with uppercase, lowercase, digit, and special char"),
  body("department").optional().trim(),
];

// POST /api/auth/register
router.post("/register", registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { name, email, password, department } = req.body as {
    name: string;
    email: string;
    password: string;
    department?: string;
  };

  const existing = await queryOne("SELECT user_id FROM users WHERE email = $1", [email]);
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await queryOne<{
    user_id: string;
    name: string;
    email: string;
    role: string;
  }>(
    `INSERT INTO users (name, email, password_hash, department)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role, department, membership_status, created_at`,
    [name, email, password_hash, department ?? null]
  );

  const tokens = generateTokens(user!.user_id, user!.email, user!.role as never);
  await storeRefreshToken(user!.user_id, tokens.refresh_token);

  logger.info("User registered", { user_id: user!.user_id, email });
  res.status(201).json({ success: true, data: { ...tokens, user } });
}));

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
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

// GET /api/auth/me
router.get("/me", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await queryOne(
    `SELECT user_id, name, email, role, department, bio, avatar_url, membership_status, created_at
     FROM users WHERE user_id = $1`,
    [req.user!.user_id]
  );
  res.json({ success: true, data: user });
}));

// PATCH /api/auth/profile
router.patch(
  "/profile",
  authenticate,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("bio").optional().trim(),
    body("department").optional().trim(),
    body("avatar_url").optional().isURL().withMessage("avatar_url must be a valid URL"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, bio, department, avatar_url } = req.body as {
      name?: string;
      bio?: string;
      department?: string;
      avatar_url?: string;
    };

    const updated = await queryOne(
      `UPDATE users SET
         name        = COALESCE($1, name),
         bio         = COALESCE($2, bio),
         department  = COALESCE($3, department),
         avatar_url  = COALESCE($4, avatar_url)
       WHERE user_id = $5
       RETURNING user_id, name, email, role, department, bio, avatar_url, membership_status, created_at`,
      [name ?? null, bio ?? null, department ?? null, avatar_url ?? null, req.user!.user_id]
    );

    logger.info("User updated profile", { user_id: req.user!.user_id });
    res.json({ success: true, data: updated });
  })
);

// PATCH /api/auth/password
router.patch(
  "/password",
  authenticate,
  [
    body("current_password").notEmpty().withMessage("Current password is required"),
    body("new_password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage("New password must be 8+ chars with uppercase, lowercase, digit, and special char"),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { current_password, new_password } = req.body as {
      current_password: string;
      new_password: string;
    };

    const user = await queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [req.user!.user_id]
    );
    if (!user) throw new AppError(404, "User not found");

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) throw new AppError(400, "Current password is incorrect");

    const new_hash = await bcrypt.hash(new_password, 12);
    await query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [new_hash, req.user!.user_id]);

    // Revoke all existing refresh tokens so other sessions are logged out
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [req.user!.user_id]);

    logger.info("User changed password", { user_id: req.user!.user_id });
    res.json({ success: true, message: "Password updated successfully" });
  })
);

function generateTokens(user_id: string, email: string, role: string) {
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
