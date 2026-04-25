import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../services/s3.service";
import { query } from "../db/pool";
import { AppError } from "./error.middleware";
import { AuthRequest } from "./auth.middleware";

// Daily upload quotas per user
const DAILY_FILE_LIMIT = 50;      // max files per day
const DAILY_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB per day

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

/**
 * Middleware to enforce per-user daily upload quotas
 * Limit: 50 files/day and 200 MB/day per user
 */
export const checkUploadQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const userId = req.user.user_id;

    // Get today's uploads for the user
    const [uploadStats] = await query<{ file_count: string; total_size: string }>(
      `SELECT 
         COUNT(*) as file_count,
         COALESCE(SUM(file_size), 0) as total_size
       FROM archive_items
       WHERE uploaded_by = $1
       AND DATE(created_at) = CURRENT_DATE`,
      [userId]
    );

    const fileCount = parseInt(uploadStats?.file_count || "0");
    const totalSize = parseInt(uploadStats?.total_size || "0");

    // Get number of files being uploaded
    const filesBeingUploaded = Array.isArray(req.files) ? req.files.length : (req.file ? 1 : 0);
    const sizeBeingUploaded = Array.isArray(req.files)
      ? req.files.reduce((sum, f) => sum + (f.size || 0), 0)
      : (req.file?.size || 0);

    // Check quotas
    if (fileCount + filesBeingUploaded > DAILY_FILE_LIMIT) {
      throw new AppError(
        429,
        `Daily file limit exceeded. You have ${fileCount}/${DAILY_FILE_LIMIT} files uploaded today. ` +
        `Cannot upload ${filesBeingUploaded} more file${filesBeingUploaded > 1 ? "s" : ""}.`
      );
    }

    if (totalSize + sizeBeingUploaded > DAILY_SIZE_LIMIT) {
      const sizeInMB = DAILY_SIZE_LIMIT / (1024 * 1024);
      const uploadedMB = totalSize / (1024 * 1024);
      const requestedMB = sizeBeingUploaded / (1024 * 1024);
      throw new AppError(
        429,
        `Daily size limit exceeded. You have uploaded ${uploadedMB.toFixed(1)}/${sizeInMB}MB today. ` +
        `Cannot upload ${requestedMB.toFixed(1)}MB more.`
      );
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(500, "Failed to check upload quota"));
    }
  }
};

export const uploadSingle = upload.single("file");
export const uploadMultiple = upload.array("files", 50); // max 50 for bulk
