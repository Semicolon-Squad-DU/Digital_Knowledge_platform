import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { query } from "../db/pool";
import { logger } from "../config/logger";
import { AuditAction } from "@dkp/shared";

export function auditLog(action: AuditAction, entityType: string) {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const entityId =
        req.params.id ||
        req.params.item_id ||
        req.params.catalog_id ||
        req.params.project_id ||
        null;

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user?.user_id ?? null,
          action,
          entityType,
          entityId,
          JSON.stringify({ method: req.method, path: req.path }),
          req.ip,
        ]
      );
    } catch (err) {
      logger.error("Failed to write audit log", { error: (err as Error).message });
    }
    next();
  };
}
