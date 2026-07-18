import { validateFileSignature } from "../file-signature";

function bytes(arr: number[], padTo = 16): Buffer {
  const buf = Buffer.alloc(Math.max(arr.length, padTo));
  Buffer.from(arr).copy(buf);
  return buf;
}

describe("validateFileSignature", () => {
  it("accepts a PDF whose bytes match the %PDF signature", () => {
    const buf = bytes([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(validateFileSignature(buf, "application/pdf")).toEqual({ valid: true });
  });

  it("rejects a file claiming to be a PDF whose bytes don't match", () => {
    const buf = bytes([0x00, 0x01, 0x02, 0x03]);
    const result = validateFileSignature(buf, "application/pdf");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/does not match/);
  });

  it("accepts a JPEG with the FF D8 FF signature", () => {
    const buf = bytes([0xff, 0xd8, 0xff, 0xe0]);
    expect(validateFileSignature(buf, "image/jpeg").valid).toBe(true);
  });

  it("accepts a PNG with the full 8-byte PNG signature", () => {
    const buf = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateFileSignature(buf, "image/png").valid).toBe(true);
  });

  it("distinguishes RIFF-based container formats by their inner tag (WEBP vs WAV vs AVI)", () => {
    const webp = bytes([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    const wav = bytes([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    const avi = bytes([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]);

    expect(validateFileSignature(webp, "image/webp").valid).toBe(true);
    expect(validateFileSignature(wav, "audio/wav").valid).toBe(true);
    expect(validateFileSignature(avi, "video/x-msvideo").valid).toBe(true);

    // A RIFF/WAVE file claiming to be WebP must be rejected — same outer
    // container, different inner tag, so this is exactly the case the check
    // at offset 8 exists to catch.
    expect(validateFileSignature(wav, "image/webp").valid).toBe(false);
  });

  it("accepts any of the ZIP-based Office/archive formats sharing the PK signature", () => {
    const zip = bytes([0x50, 0x4b, 0x03, 0x04]);
    expect(validateFileSignature(zip, "application/zip").valid).toBe(true);
    expect(
      validateFileSignature(zip, "application/vnd.openxmlformats-officedocument.wordprocessingml.document").valid
    ).toBe(true);
  });

  it("always accepts text/plain and application/json regardless of bytes, since there's no binary signature to check", () => {
    const buf = bytes([0x00, 0xff, 0x10, 0x20]);
    expect(validateFileSignature(buf, "text/plain").valid).toBe(true);
    expect(validateFileSignature(buf, "application/json").valid).toBe(true);
  });

  it("returns valid for a claimed MIME type with no known signature entry", () => {
    const buf = bytes([0x01, 0x02, 0x03]);
    expect(validateFileSignature(buf, "application/octet-stream")).toEqual({ valid: true });
  });

  // The core NFR-011 guarantee: an executable is rejected no matter what
  // MIME type the client claims, since renaming evil.exe to report.pdf and
  // setting Content-Type by hand is exactly the attack this defends against.
  it("rejects a Windows PE executable disguised with any claimed MIME type", () => {
    const buf = bytes([0x4d, 0x5a, 0x90, 0x00]);
    const result = validateFileSignature(buf, "application/pdf");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/executable/i);
    expect(result.reason).toMatch(/Windows PE\/EXE/);
  });

  it("rejects an ELF binary disguised as a JPEG", () => {
    const buf = bytes([0x7f, 0x45, 0x4c, 0x46]);
    expect(validateFileSignature(buf, "image/jpeg").valid).toBe(false);
  });

  it("rejects all four Mach-O magic-number variants disguised as PNG", () => {
    const variants = [
      [0xfe, 0xed, 0xfa, 0xce],
      [0xfe, 0xed, 0xfa, 0xcf],
      [0xce, 0xfa, 0xed, 0xfe],
      [0xcf, 0xfa, 0xed, 0xfe],
    ];
    for (const sig of variants) {
      expect(validateFileSignature(bytes(sig), "image/png").valid).toBe(false);
    }
  });

  it("rejects a shebang script disguised as a text file", () => {
    const buf = bytes([0x23, 0x21, 0x2f, 0x62, 0x69, 0x6e, 0x2f, 0x73, 0x68]);
    // Executable check runs before the (always-true) text/plain check, so
    // this must still be rejected even though text/plain has no signature.
    expect(validateFileSignature(buf, "text/plain").valid).toBe(false);
  });

  it("rejects buffers too short to contain the claimed signature instead of throwing", () => {
    const tiny = Buffer.from([0x25]);
    const result = validateFileSignature(tiny, "application/pdf");
    expect(result.valid).toBe(false);
  });
});
