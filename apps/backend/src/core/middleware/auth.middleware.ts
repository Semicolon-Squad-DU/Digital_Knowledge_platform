import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { query, queryOne } from "../db/pool";
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
//
// Also enforces NFR-006's server-side inactivity timeout: last_active_at is
// compared against the configured window (default 30 min) on every request,
// independent of the access token's own (longer) cryptographic expiry. A
// null last_active_at (never set, e.g. right after login) is treated as
// fresh rather than stale.
//
// The idle comparison is done entirely in SQL (NOW() - last_active_at),
// deliberately not in application code (Date.now() - last_active_at) — the
// app server's clock and the database server's clock are two different
// machines and are not guaranteed to agree; comparing across them can
// produce a negative "idle" duration if they've drifted, silently
// disabling the timeout. Keeping both sides of the comparison on Postgres's
// own clock avoids that class of bug entirely.
async function checkAccountActiveAndFresh(user_id: string): Promise<"ok" | "inactive" | "idle"> {
  const account = await queryOne<{ membership_status: string; is_idle: boolean }>(
    `SELECT membership_status,
            (last_active_at IS NOT NULL AND NOW() - last_active_at > ($2 || ' minutes')::interval) as is_idle
     FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
    [user_id, config.jwt.sessionInactivityTimeoutMinutes]
  );
  if (!account) return "inactive";
  if (account.membership_status !== "active" && account.membership_status !== "pending_approval") {
    return "inactive";
  }
  if (account.is_idle) return "idle";

  // Fire-and-forget — this is a liveness heartbeat, not something the
  // request should ever fail or slow down on.
  void query("UPDATE users SET last_active_at = NOW() WHERE user_id = $1", [user_id]).catch(() => {});

  return "ok";
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
    const status = await checkAccountActiveAndFresh(payload.user_id);
    if (status === "inactive") {
      res.status(401).json({ success: false, message: "Account is not active. Contact administrator." });
      return;
    }
    if (status === "idle") {
      res.status(401).json({ success: false, message: "Session expired due to inactivity. Please sign in again." });
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
      // Best-effort: a suspended/idle account just falls back to anonymous here
      // rather than blocking the request, matching this middleware's
      // non-blocking intent.
      if ((await checkAccountActiveAndFresh(payload.user_id)) === "ok") {
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
