import { Server } from "@tus/server";
import { S3Store } from "@tus/s3-store";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { config } from "../core/config";
import { logger } from "../core/config/logger";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, s3Client } from "./s3.service";
import { scanReadable, MalwareDetectedError, ScannerUnavailableError } from "./antivirus.service";

export const TUS_PATH = "/api/uploads/tus";

const s3Store = new S3Store({
  partSize: 8 * 1024 * 1024, // 8 MiB per part — well within S3's 5 MiB minimum
  s3ClientConfig: {
    bucket: config.s3.bucket,
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.s3.accessKey,
      secretAccessKey: config.s3.secretKey,
    },
  },
});

interface AuthTokenPayload {
  user_id: string;
  role: string;
}

/**
 * tus resumable upload server — gives large files (up to 500 MB) network-interruption
 * resilience per the SDD's "Tus resumable upload protocol" design decision. Chunks are
 * streamed straight to S3 via multipart upload (S3Store), so an interrupted transfer
 * resumes from the last acknowledged byte instead of restarting from zero.
 *
 * Auth model: the JWT is verified once at upload *creation* (like most tus deployments —
 * e.g. Uppy's Companion). The server then hands back an unguessable upload URL that acts
 * as a bearer capability for the PATCH/HEAD calls that follow, matching the tus protocol's
 * own trust model. Role/size/mimetype are all validated at creation time, before any bytes
 * are accepted.
 */
export const tusServer = new Server({
  path: TUS_PATH,
  datastore: s3Store,
  maxSize: MAX_FILE_SIZE,
  respectForwardedHeaders: true,
  // tus's default ID-from-URL extraction only ever captures the last path
  // segment (`/([^/]+)\/?$/`), so the id must stay flat — no "/" — or every
  // request after creation (HEAD/PATCH) resolves to the wrong object.
  namingFunction: (_req, metadata) => {
    const ext = (metadata?.filename as string | undefined)?.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "";
    return `archive-tus-${crypto.randomUUID()}${ext}`;
  },
  onUploadCreate: async (req) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw { status_code: 401, body: "Authentication required" };
    }

    let payload: AuthTokenPayload;
    try {
      payload = jwt.verify(authHeader.slice(7), config.jwt.secret) as AuthTokenPayload;
    } catch {
      throw { status_code: 401, body: "Invalid or expired token" };
    }

    if (!["archivist", "admin"].includes(payload.role)) {
      throw { status_code: 403, body: "Only an Archivist or Admin can upload archive documents" };
    }

    return { metadata: {} };
  },
  onUploadFinish: async (_req, upload) => {
    const mimetype = upload.metadata?.filetype as string | undefined;
    if (mimetype && !ALLOWED_MIME_TYPES.has(mimetype)) {
      // Reject post-hoc — S3Store has already written the object, so also clean it up.
      await s3Store.remove(upload.id).catch(() => {});
      throw { status_code: 415, body: `Unsupported file type: ${mimetype}` };
    }

    // tus streams chunks straight to S3 (never passing through uploadToS3's
    // scan), so the completed object has to be scanned here instead — before
    // anything else can reference it. Same reject-and-clean-up pattern as the
    // MIME check above.
    try {
      const object = await s3Client.send(
        new GetObjectCommand({ Bucket: config.s3.bucket, Key: upload.id })
      );
      await scanReadable(object.Body as Readable);
    } catch (err) {
      await s3Store.remove(upload.id).catch(() => {});
      if (err instanceof MalwareDetectedError) {
        throw { status_code: 422, body: err.message };
      }
      if (err instanceof ScannerUnavailableError) {
        throw { status_code: 503, body: err.message };
      }
      throw err;
    }

    logger.info("tus upload finished", { id: upload.id, size: upload.size });
    return {};
  },
});
