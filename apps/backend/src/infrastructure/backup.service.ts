import { spawn } from "child_process";
import { existsSync } from "fs";
import { dirname, join, parse } from "path";
import { Readable } from "stream";
import zlib from "zlib";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../core/config";
import { logger } from "../core/config/logger";
import { query, queryOne } from "../core/db/pool";
import { s3Client, uploadToS3, getPresignedUrl } from "./s3.service";

// Docker/production images install postgresql client tools onto PATH (see
// apps/backend/Dockerfile). Local Windows dev machines usually don't have
// pg_dump/psql installed system-wide, so we fall back to a vendored copy at
// apps/backend/vendor/pgsql-bin (gitignored — see vendor/README) if PATH
// resolution would otherwise fail. Walk up from __dirname to find the
// apps/backend package root, since it sits at a different depth under
// dist/ (tsc build) vs src/ (tsx dev).
function findBackendRoot(): string | null {
  let dir = __dirname;
  while (true) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "vendor"))) return dir;
    const parent = dirname(dir);
    if (parent === dir || parse(dir).root === dir) return null;
    dir = parent;
  }
}

function resolveBinary(name: string): string {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const backendRoot = findBackendRoot();
  if (backendRoot) {
    const vendored = join(backendRoot, "vendor", "pgsql-bin", exe);
    if (existsSync(vendored)) return vendored;
  }
  return name;
}

// config.db.url carries driver-specific query params (e.g. Supabase pooler's
// "uselibpqcompat") meant for the app's `pg` connection pool. Raw libpq-based
// CLI tools like pg_dump/psql reject unrecognized URI query params outright,
// so strip anything libpq doesn't understand before shelling out.
const LIBPQ_ALLOWED_PARAMS = new Set(["sslmode", "sslcert", "sslkey", "sslrootcert", "connect_timeout", "application_name", "options"]);
function toLibpqConnectionString(url: string): string {
  const parsed = new URL(url);
  for (const key of [...parsed.searchParams.keys()]) {
    if (!LIBPQ_ALLOWED_PARAMS.has(key)) parsed.searchParams.delete(key);
  }
  return parsed.toString();
}

export interface BackupRecord {
  backup_id: string;
  filename: string;
  s3_key: string | null;
  size_bytes: number | null;
  status: "running" | "completed" | "failed";
  triggered_by: "scheduled" | "manual";
  triggered_by_user: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

function timestampSlug(d = new Date()): string {
  return d.toISOString().replace(/[:T]/g, "-").split(".")[0];
}

export async function listBackups(limit = 50): Promise<BackupRecord[]> {
  return query<BackupRecord>(
    `SELECT backup_id, filename, s3_key, size_bytes, status, triggered_by,
            triggered_by_user, error_message, started_at, completed_at, created_at
     FROM backups ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getBackup(id: string): Promise<BackupRecord | null> {
  return queryOne<BackupRecord>("SELECT * FROM backups WHERE backup_id = $1", [id]);
}

// Runs pg_dump -> gzip entirely in memory and returns the compressed buffer.
// Rejects with a descriptive error (e.g. "pg_dump not available") rather than
// crashing the process, so callers can record an honest failure status.
function dumpDatabase(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pgDump = spawn(resolveBinary("pg_dump"), ["--no-owner", "--no-privileges", "--clean", "--if-exists", "-d", toLibpqConnectionString(config.db.url)]);
    const gzip = zlib.createGzip();
    const chunks: Buffer[] = [];
    let stderr = "";
    let settled = false;

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    pgDump.stderr.on("data", (d) => { stderr += d.toString(); });
    pgDump.on("error", (err) => fail(new Error(`pg_dump not available: ${err.message}`)));

    pgDump.stdout.pipe(gzip);
    gzip.on("error", fail);
    gzip.on("data", (chunk) => chunks.push(chunk));

    pgDump.on("close", (code) => {
      if (code !== 0) {
        fail(new Error(`pg_dump exited with code ${code}: ${stderr.trim() || "unknown error"}`));
      }
    });

    gzip.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
  });
}

// Performs a full backup synchronously: creates the DB record, runs pg_dump,
// uploads to S3, and updates the record to its final status. Never throws —
// failures are captured in the returned record's status/error_message so
// callers (API + scheduler) get honest reporting either way.
export async function performBackup(
  triggeredBy: "scheduled" | "manual",
  userId?: string
): Promise<BackupRecord> {
  const filename = `dkp_backup_${timestampSlug()}.sql.gz`;
  const record = await queryOne<BackupRecord>(
    `INSERT INTO backups (filename, status, triggered_by, triggered_by_user, started_at)
     VALUES ($1, 'running', $2, $3, NOW()) RETURNING *`,
    [filename, triggeredBy, userId ?? null]
  );
  if (!record) throw new Error("Failed to create backup record");

  try {
    const dumpBuffer = await dumpDatabase();
    const s3Key = `backups/${filename}`;
    // System-generated DB dump, not user-uploaded content — skip the malware scan.
    await uploadToS3(s3Key, dumpBuffer, "application/gzip", { skipScan: true });

    const [updated] = await query<BackupRecord>(
      `UPDATE backups SET status = 'completed', s3_key = $1, size_bytes = $2, completed_at = NOW()
       WHERE backup_id = $3 RETURNING *`,
      [s3Key, dumpBuffer.length, record.backup_id]
    );
    logger.info("Backup completed", { backupId: record.backup_id, filename, size: dumpBuffer.length });
    return updated;
  } catch (err) {
    const message = (err as Error).message;
    const [updated] = await query<BackupRecord>(
      `UPDATE backups SET status = 'failed', error_message = $1, completed_at = NOW()
       WHERE backup_id = $2 RETURNING *`,
      [message, record.backup_id]
    );
    logger.error("Backup failed", { backupId: record.backup_id, error: message });
    return updated;
  }
}

export async function getBackupDownloadUrl(id: string): Promise<string> {
  const backup = await getBackup(id);
  if (!backup) throw new Error("Backup not found");
  if (backup.status !== "completed" || !backup.s3_key) {
    throw new Error("Backup is not available for download");
  }
  return getPresignedUrl(backup.s3_key);
}

async function downloadBackupBuffer(s3Key: string): Promise<Buffer> {
  const res = await s3Client.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: s3Key }));
  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function restoreDatabase(gzippedSql: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const psql = spawn(resolveBinary("psql"), ["--set", "ON_ERROR_STOP=1", "-d", toLibpqConnectionString(config.db.url)]);
    let stderr = "";
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) reject(err); else resolve();
    };

    psql.stderr.on("data", (d) => { stderr += d.toString(); });
    psql.on("error", (err) => finish(new Error(`psql not available: ${err.message}`)));
    psql.on("close", (code) => {
      if (code !== 0) {
        finish(new Error(`psql exited with code ${code}: ${stderr.trim() || "unknown error"}`));
      } else {
        finish();
      }
    });

    const gunzip = zlib.createGunzip();
    gunzip.on("error", (err) => finish(new Error(`Failed to decompress backup: ${err.message}`)));
    gunzip.pipe(psql.stdin);
    Readable.from(gzippedSql).pipe(gunzip);
  });
}

export interface RestoreResult {
  restoredFrom: BackupRecord;
  preRestoreBackup: BackupRecord;
}

// Restores a completed backup into the live database. Always takes a fresh
// "safety" backup first and aborts (without touching the live DB) if that
// safety backup does not complete successfully.
export async function restoreBackup(id: string, userId: string): Promise<RestoreResult> {
  const backup = await getBackup(id);
  if (!backup) throw new Error("Backup not found");
  if (backup.status !== "completed" || !backup.s3_key) {
    throw new Error("Backup is not available for restore");
  }

  logger.warn("Database restore initiated", { backupId: id, filename: backup.filename, userId });

  const preRestoreBackup = await performBackup("manual", userId);
  if (preRestoreBackup.status !== "completed") {
    throw new Error(
      `Aborted restore: pre-restore safety backup failed (${preRestoreBackup.error_message ?? "unknown error"})`
    );
  }

  const gzippedSql = await downloadBackupBuffer(backup.s3_key);
  await restoreDatabase(gzippedSql);

  logger.warn("Database restore completed", { backupId: id, filename: backup.filename, userId });

  return { restoredFrom: backup, preRestoreBackup };
}
