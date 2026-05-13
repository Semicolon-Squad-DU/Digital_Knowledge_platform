import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../core/config";
import { logger } from "../core/config/logger";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";

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

const DKP_QUEUE_DIR = path.resolve(process.cwd(), "dkp-queue");

function ensureQueueDir() {
  if (!fs.existsSync(DKP_QUEUE_DIR)) {
    fs.mkdirSync(DKP_QUEUE_DIR, { recursive: true });
  }
}

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
    logger.warn("S3 upload failed, saving to local queue", {
      key,
      error: (err as Error).message,
    });

    ensureQueueDir();
    const safeFilename = key.replace(/\//g, "_");
    const filePath = path.join(DKP_QUEUE_DIR, safeFilename);
    const metaPath = path.join(DKP_QUEUE_DIR, `${safeFilename}.meta.json`);

    await fsPromises.writeFile(filePath, body);
    await fsPromises.writeFile(
      metaPath,
      JSON.stringify({ key, contentType, queuedAt: new Date().toISOString() }, null, 2)
    );

    logger.info("File saved to local queue", { localPath: filePath });
    return `local://${key}`;
  }
}

export async function retryQueuedUploads(): Promise<void> {
  ensureQueueDir();
  const files = await fsPromises.readdir(DKP_QUEUE_DIR);
  const metaFiles = files.filter((f) => f.endsWith(".meta.json"));

  if (metaFiles.length === 0) {
    logger.info("No queued uploads to retry");
    return;
  }

  logger.info(`Retrying ${metaFiles.length} queued upload(s)`);

  for (const metaFile of metaFiles) {
    const metaPath = path.join(DKP_QUEUE_DIR, metaFile);
    const dataFile = metaFile.replace(".meta.json", "");
    const dataPath = path.join(DKP_QUEUE_DIR, dataFile);

    try {
      const meta = JSON.parse(await fsPromises.readFile(metaPath, "utf-8")) as {
        key: string;
        contentType: string;
      };
      const body = await fsPromises.readFile(dataPath);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.s3.bucket,
          Key: meta.key,
          Body: body,
          ContentType: meta.contentType,
        })
      );

      await fsPromises.unlink(dataPath);
      await fsPromises.unlink(metaPath);
      logger.info("Queued upload retried successfully", { key: meta.key });
    } catch (err) {
      logger.error("Failed to retry queued upload", {
        file: metaFile,
        error: (err as Error).message,
      });
    }
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 900 // 15 minutes
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })
  );
  logger.debug("File deleted from S3", { key });
}

export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}
