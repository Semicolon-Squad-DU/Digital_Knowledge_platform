import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config";
import { logger } from "../config/logger";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

export const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
]);

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

/** Local queue directory for failed S3 uploads */
const DKP_QUEUE_DIR = path.resolve(process.cwd(), "dkp-queue");

export function validateFile(
  mimetype: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    return { valid: false, error: `Unsupported file type: ${mimetype}` };
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds maximum size of 500 MB" };
  }
  return { valid: true };
}

export function generateS3Key(
  folder: string,
  originalName: string,
  mimetype: string
): string {
  const ext = path.extname(originalName) || mimeToExt(mimetype);
  return `${folder}/${uuidv4()}${ext}`;
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "video/mp4": ".mp4",
    "audio/mpeg": ".mp3",
  };
  return map[mime] || "";
}

/**
 * Save a failed upload to the local dkp-queue/ directory with a companion
 * metadata JSON file so it can be retried later by retryQueuedUploads().
 *
 * Returns a `local://<key>` prefixed key that identifies the queued file.
 */
function saveToLocalQueue(key: string, body: Buffer, contentType: string): string {
  try {
    if (!fs.existsSync(DKP_QUEUE_DIR)) {
      fs.mkdirSync(DKP_QUEUE_DIR, { recursive: true });
    }

    const safeFilename = key.replace(/\//g, "__");
    const filePath  = path.join(DKP_QUEUE_DIR, safeFilename);
    const metaPath  = `${filePath}.meta.json`;

    fs.writeFileSync(filePath, body);
    fs.writeFileSync(
      metaPath,
      JSON.stringify({ key, contentType, queuedAt: new Date().toISOString() }, null, 2)
    );

    logger.warn("S3 upload failed – file queued locally", { key, filePath });
    return `local://${key}`;
  } catch (localErr) {
    logger.error("Failed to save file to local queue", {
      key,
      error: (localErr as Error).message,
    });
    throw localErr;
  }
}

/**
 * Upload a file to S3 / MinIO.
 *
 * On failure the file is saved to `dkp-queue/` and a `local://` prefixed key
 * is returned so the calling code can continue without crashing.  The queued
 * files are picked up by `retryQueuedUploads()`.
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    logger.debug("File uploaded to S3", { key });
    return key;
  } catch (err) {
    logger.error("S3 upload failed, falling back to local queue", {
      key,
      error: (err as Error).message,
    });
    return saveToLocalQueue(key, body, contentType);
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 900 // 15 minutes
): Promise<string> {
  // If the file is still in the local queue serve a placeholder URL
  if (key.startsWith("local://")) {
    const realKey    = key.slice(8);
    const safeFilename = realKey.replace(/\//g, "__");
    const filePath   = path.join(DKP_QUEUE_DIR, safeFilename);
    if (fs.existsSync(filePath)) {
      return `/api/queue-files/${encodeURIComponent(safeFilename)}`;
    }
    return key;
  }

  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  if (key.startsWith("local://")) {
    const realKey      = key.slice(8);
    const safeFilename = realKey.replace(/\//g, "__");
    const filePath     = path.join(DKP_QUEUE_DIR, safeFilename);
    try {
      if (fs.existsSync(filePath))   fs.unlinkSync(filePath);
      if (fs.existsSync(`${filePath}.meta.json`)) fs.unlinkSync(`${filePath}.meta.json`);
    } catch {
      // best-effort
    }
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })
  );
  logger.debug("File deleted from S3", { key });
}

export async function fileExistsInS3(key: string): Promise<boolean> {
  if (key.startsWith("local://")) return false;
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry all files currently sitting in the local dkp-queue/ directory.
 *
 * For each queued file it reads the companion `.meta.json`, attempts to
 * upload to S3, and on success removes both the file and its metadata.
 * Failures are logged and left in the queue for the next retry cycle.
 */
export async function retryQueuedUploads(): Promise<void> {
  if (!fs.existsSync(DKP_QUEUE_DIR)) return;

  const entries = fs.readdirSync(DKP_QUEUE_DIR).filter(
    (f) => !f.endsWith(".meta.json")
  );

  if (entries.length === 0) return;

  logger.info("Retrying queued uploads", { count: entries.length });

  for (const filename of entries) {
    const filePath = path.join(DKP_QUEUE_DIR, filename);
    const metaPath = `${filePath}.meta.json`;

    try {
      if (!fs.existsSync(metaPath)) {
        logger.warn("Queue file missing metadata – skipping", { filename });
        continue;
      }

      const meta: { key: string; contentType: string } = JSON.parse(
        fs.readFileSync(metaPath, "utf8")
      );
      const body = fs.readFileSync(filePath);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.s3.bucket,
          Key: meta.key,
          Body: body,
          ContentType: meta.contentType,
        })
      );

      // Upload succeeded – remove queued files
      fs.unlinkSync(filePath);
      fs.unlinkSync(metaPath);

      logger.info("Queued upload retried successfully", { key: meta.key });
    } catch (err) {
      logger.warn("Queued upload retry failed – will try again later", {
        filename,
        error: (err as Error).message,
      });
    }
  }
}

