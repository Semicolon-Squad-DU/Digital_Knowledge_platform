import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../services/s3.service";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "./error.middleware";

// Store in memory for S3 upload
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const uploadSingle = upload.single("file");
export const uploadMultiple = upload.array("files", 50); // max 50 for bulk

// ---------------------------------------------------------------------------
// Per-user daily upload quotas
//   • 50  files / day
//   • 200 MB / day
// ---------------------------------------------------------------------------

const MAX_FILES_PER_DAY  = 50;
const MAX_BYTES_PER_DAY  = 200 * 1024 * 1024; // 200 MB

interface DayQuota {
  date: string;   // ISO date string "YYYY-MM-DD"
  files: number;
  bytes: number;
}

// In-process store; resets naturally when the date changes
const quotaStore = new Map<string, DayQuota>();

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getUserQuota(userId: string): DayQuota {
  const today = todayStr();
  let q = quotaStore.get(userId);
  if (!q || q.date !== today) {
    q = { date: today, files: 0, bytes: 0 };
    quotaStore.set(userId, q);
  }
  return q;
}

/**
 * Middleware that enforces per-user daily upload quotas.
 * Must be placed AFTER the multer middleware so req.file / req.files are populated.
 */
export function enforceUploadQuota(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    // unauthenticated – let the auth middleware handle it
    return next();
  }

  const userId = authReq.user.user_id;
  const quota  = getUserQuota(userId);

  const files: Express.Multer.File[] = req.file
    ? [req.file]
    : (req.files as Express.Multer.File[]) ?? [];

  const incomingFiles = files.length;
  const incomingBytes = files.reduce((sum, f) => sum + f.size, 0);

  if (quota.files + incomingFiles > MAX_FILES_PER_DAY) {
    return next(
      new AppError(429, `Daily upload limit reached (${MAX_FILES_PER_DAY} files/day)`)
    );
  }
  if (quota.bytes + incomingBytes > MAX_BYTES_PER_DAY) {
    return next(
      new AppError(429, `Daily upload size limit reached (${MAX_BYTES_PER_DAY / 1024 / 1024} MB/day)`)
    );
  }

  // Reserve quota – commit only when upload succeeds (best-effort)
  quota.files += incomingFiles;
  quota.bytes += incomingBytes;

  next();
}

