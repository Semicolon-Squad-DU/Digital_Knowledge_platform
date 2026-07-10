import NodeClam from "clamscan";
import { Readable } from "stream";
import { config } from "../core/config";
import { logger } from "../core/config/logger";

let clamscan: NodeClam | null = null;

// Unlike Elasticsearch/S3, this is a security control (NFR-TXX-011), not just
// an availability nice-to-have — if the scanner can't be reached, uploads
// must be rejected rather than silently let through unscanned.
let isAntivirusAvailable = false;

export async function initializeAntivirus(): Promise<void> {
  try {
    clamscan = await new NodeClam().init({
      removeInfected: false,
      debugMode: false,
      clamdscan: {
        host: config.clamav.host,
        port: config.clamav.port,
        timeout: 60_000,
        localFallback: false,
        bypassTest: false,
      },
      preference: "clamdscan",
    });
    await clamscan.ping();
    isAntivirusAvailable = true;
    logger.info("ClamAV connected — upload scanning enabled");
  } catch (err) {
    isAntivirusAvailable = false;
    logger.error("ClamAV not available — file uploads will be rejected until it's reachable", {
      error: (err as Error).message,
    });
  }
}

export class MalwareDetectedError extends Error {
  constructor(public viruses: string[]) {
    super(`Malware detected: ${viruses.join(", ") || "unknown signature"}`);
    this.name = "MalwareDetectedError";
  }
}

export class ScannerUnavailableError extends Error {
  constructor() {
    super("Malware scanner is unavailable — upload rejected for safety");
    this.name = "ScannerUnavailableError";
  }
}

/**
 * Scans a readable stream for malware before it's allowed anywhere near S3.
 * Fails closed: if the scanner isn't reachable, the upload is rejected rather
 * than silently skipped. Streams instead of buffering so large (tus, up to
 * 500 MB) uploads don't have to be held fully in memory to be scanned.
 */
export async function scanReadable(stream: Readable): Promise<void> {
  if (!isAntivirusAvailable || !clamscan) {
    throw new ScannerUnavailableError();
  }

  const { isInfected, viruses } = await clamscan.scanStream(stream);

  if (isInfected) {
    logger.warn("Malware detected in upload — rejected", { viruses });
    throw new MalwareDetectedError(viruses);
  }
}

export async function scanBuffer(buffer: Buffer): Promise<void> {
  return scanReadable(Readable.from(buffer));
}
