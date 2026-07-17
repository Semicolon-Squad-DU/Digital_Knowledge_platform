import { Request, Response, NextFunction, RequestHandler } from "express";
import { MulterError } from "multer";
import { logger } from "../config/logger";
import { MalwareDetectedError, ScannerUnavailableError } from "../../infrastructure/antivirus.service";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Multer errors
  if (err.message?.includes("Unsupported file type") || err.message?.includes("File too large")) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT"
      ? "Too many files in one batch. Bulk upload accepts a maximum of 50 files at a time."
      : err.code === "LIMIT_FILE_SIZE"
        ? "One or more files exceed the maximum upload size."
        : err.message;
    res.status(400).json({ success: false, message });
    return;
  }

  if (err instanceof MalwareDetectedError) {
    res.status(422).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof ScannerUnavailableError) {
    res.status(503).json({ success: false, message: err.message });
    return;
  }

  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// Wraps async route handlers so thrown errors are forwarded to Express error middleware
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
