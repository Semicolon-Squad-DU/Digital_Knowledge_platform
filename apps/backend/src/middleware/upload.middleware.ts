import multer from "multer";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../services/s3.service";

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
