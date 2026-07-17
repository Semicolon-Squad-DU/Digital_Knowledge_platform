import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { queryOne } from "../db/pool";
import { AuthTokenPayload, UserRole } from "@dkp/shared";

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

// The JWT signature alone only proves the token was issued while the account was
// active — it says nothing about right now. Without this, a suspended/deactivated
// account keeps full access for the rest of its access token's lifetime (up to
// JWT_ACCESS_EXPIRES_IN) instead of being cut off on its next request.
//
// "pending_approval" also counts as active here: a *brand-new* signup never gets
// this far because /login itself refuses to issue tokens while pending (see
// auth.routes.ts). But an already-active user who self-service requests a role
// change (POST /auth/me/role-request) is deliberately flipped into
// "pending_approval" while keeping their existing session — they should keep
// using the app under their current role until an admin reviews the request,
// not get logged out by their own request.
async function isAccountActive(user_id: string): Promise<boolean> {
  const account = await queryOne<{ membership_status: string }>(
    "SELECT membership_status FROM users WHERE user_id = $1 AND deleted_at IS NULL",
    [user_id]
  );
  return account?.membership_status === "active" || account?.membership_status === "pending_approval";
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  try {
    if (!(await isAccountActive(payload.user_id))) {
      res.status(401).json({ success: false, message: "Account is not active. Contact administrator." });
      return;
    }
  } catch (err) {
    next(err);
    return;
  }

  req.user = payload;
  next();
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
      // Best-effort: a suspended account just falls back to anonymous here rather
      // than blocking the request, matching this middleware's non-blocking intent.
      if (await isAccountActive(payload.user_id)) {
        req.user = payload;
      }
    } catch {
      // ignore invalid token or transient DB error for optional auth
    }
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }
    next();
  };
}

// Role hierarchy check
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  member: 1,
  student_author: 2,
  researcher: 2,
  archivist: 3,
  librarian: 3,
  admin: 4,
};

export function requireMinRole(minRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[minRole]) {
      res.status(403).json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
