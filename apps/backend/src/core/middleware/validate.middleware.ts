import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError, ZodTypeAny, z } from "zod";

// Mirrors the { success: false, errors: [...] } shape auth.routes.ts already
// returns via express-validator's errors.array(), so existing frontend error
// handling (e.g. register page's response?.errors?.map(e => e.msg)) keeps
// working the same way regardless of which validation layer a route uses.
function zodErrorsToLegacyShape(error: ZodError): { msg: string; path: string }[] {
  return error.errors.map((e) => ({
    msg: e.message,
    path: e.path.join("."),
  }));
}

// Validates req.body against the given schema and replaces req.body with the
// parsed (and thus coerced/defaulted) result, so downstream handlers can trust
// its shape instead of re-casting `req.body as {...}`.
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, errors: zodErrorsToLegacyShape(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Same as validateBody but for req.query — query values arrive as strings, so
// schemas passed here should z.coerce numbers/booleans as needed.
export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ success: false, errors: zodErrorsToLegacyShape(result.error) });
      return;
    }
    // req.query is a getter-only property on some Express/Node versions;
    // assigning the parsed values onto the existing object keeps it live
    // instead of replacing the reference.
    Object.assign(req.query, result.data);
    next();
  };
}

export { z };
