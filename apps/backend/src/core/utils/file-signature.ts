/**
 * Magic-byte (file-signature) validation — NFR-011. Multer's fileFilter only
 * checks the client-supplied Content-Type header, which is trivially spoofed
 * (e.g. renaming evil.exe to report.pdf and setting Content-Type by hand).
 * This checks the actual leading bytes of the uploaded buffer against known
 * signatures for the MIME type the client claimed, so a mismatch is caught
 * before the file ever reaches malware scanning or storage.
 *
 * Hand-rolled rather than pulling in a signature-detection library (e.g.
 * file-type) to keep this dependency-free for a security-critical path —
 * see the CSV-parser precedent in csv.ts for the same reasoning.
 */

type SignatureCheck = (buf: Buffer) => boolean;

function bytesMatch(buf: Buffer, offset: number, signature: number[]): boolean {
  if (buf.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[offset + i] !== signature[i]) return false;
  }
  return true;
}

// ZIP-based Office formats (docx/pptx/xlsx) and plain zip/jar all share the
// PK signature at offset 0; we don't attempt to distinguish between them
// further here since ALLOWED_MIME_TYPES already pins the exact MIME type
// via the Content-Type check that runs alongside this one.
const isZipBased: SignatureCheck = (buf) =>
  bytesMatch(buf, 0, [0x50, 0x4b, 0x03, 0x04]) || bytesMatch(buf, 0, [0x50, 0x4b, 0x05, 0x06]) || bytesMatch(buf, 0, [0x50, 0x4b, 0x07, 0x08]);

const SIGNATURES: Record<string, SignatureCheck> = {
  "application/pdf": (buf) => bytesMatch(buf, 0, [0x25, 0x50, 0x44, 0x46]), // %PDF
  "image/jpeg": (buf) => bytesMatch(buf, 0, [0xff, 0xd8, 0xff]),
  "image/png": (buf) => bytesMatch(buf, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/tiff": (buf) => bytesMatch(buf, 0, [0x49, 0x49, 0x2a, 0x00]) || bytesMatch(buf, 0, [0x4d, 0x4d, 0x00, 0x2a]),
  "image/webp": (buf) => bytesMatch(buf, 0, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(buf, 8, [0x57, 0x45, 0x42, 0x50]), // RIFF....WEBP
  "audio/mpeg": (buf) => bytesMatch(buf, 0, [0x49, 0x44, 0x33]) || bytesMatch(buf, 0, [0xff, 0xfb]) || bytesMatch(buf, 0, [0xff, 0xf3]) || bytesMatch(buf, 0, [0xff, 0xf2]),
  "audio/wav": (buf) => bytesMatch(buf, 0, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(buf, 8, [0x57, 0x41, 0x56, 0x45]), // RIFF....WAVE
  "audio/ogg": (buf) => bytesMatch(buf, 0, [0x4f, 0x67, 0x67, 0x53]), // OggS
  "video/mp4": (buf) => bytesMatch(buf, 4, [0x66, 0x74, 0x79, 0x70]), // ....ftyp
  "video/webm": (buf) => bytesMatch(buf, 0, [0x1a, 0x45, 0xdf, 0xa3]),
  "video/x-msvideo": (buf) => bytesMatch(buf, 0, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(buf, 8, [0x41, 0x56, 0x49, 0x20]), // RIFF....AVI
  "application/zip": isZipBased,
  "application/x-zip-compressed": isZipBased,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": isZipBased,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": isZipBased,
  // No reliable binary signature for these — content is arbitrary text, so
  // there's nothing to sniff beyond "is it valid UTF-8/ASCII-ish", which
  // fileFilter's MIME check plus the AV scan already cover adequately.
  "text/plain": () => true,
  "application/json": () => true,
};

// A handful of well-known executable/script signatures, checked regardless
// of the declared MIME type — these should never be accepted no matter what
// Content-Type the client claims, since none of ALLOWED_MIME_TYPES are
// legitimately executable.
const EXECUTABLE_SIGNATURES: { name: string; check: SignatureCheck }[] = [
  { name: "Windows PE/EXE", check: (buf) => bytesMatch(buf, 0, [0x4d, 0x5a]) },
  { name: "ELF binary", check: (buf) => bytesMatch(buf, 0, [0x7f, 0x45, 0x4c, 0x46]) },
  { name: "Mach-O binary", check: (buf) => bytesMatch(buf, 0, [0xfe, 0xed, 0xfa, 0xce]) || bytesMatch(buf, 0, [0xfe, 0xed, 0xfa, 0xcf]) || bytesMatch(buf, 0, [0xce, 0xfa, 0xed, 0xfe]) || bytesMatch(buf, 0, [0xcf, 0xfa, 0xed, 0xfe]) },
  { name: "shell script", check: (buf) => bytesMatch(buf, 0, [0x23, 0x21]) }, // #!
];

export interface FileSignatureResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that a file's actual bytes match its claimed MIME type, and
 * rejects known executable signatures outright regardless of claimed type.
 */
export function validateFileSignature(buffer: Buffer, claimedMimeType: string): FileSignatureResult {
  for (const { name, check } of EXECUTABLE_SIGNATURES) {
    if (check(buffer)) {
      return { valid: false, reason: `File appears to be an executable (${name}), which is never permitted` };
    }
  }

  const check = SIGNATURES[claimedMimeType];
  if (!check) {
    // No known signature for this MIME type — nothing further to verify here.
    return { valid: true };
  }

  if (!check(buffer)) {
    return { valid: false, reason: `File content does not match the declared type (${claimedMimeType})` };
  }

  return { valid: true };
}
