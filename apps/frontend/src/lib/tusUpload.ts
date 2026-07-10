import * as tus from "tus-js-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TUS_ENDPOINT = `${API_URL}/uploads/tus`;

/** Large files (above this size) go over tus for resumability; small files use
 * the plain multipart route since the extra round-trips aren't worth it. */
export const TUS_SIZE_THRESHOLD = 20 * 1024 * 1024; // 20 MB

/**
 * Uploads a file via the tus resumable protocol, surviving network drops —
 * an interrupted upload resumes from the last acknowledged byte on retry
 * instead of restarting, which matters for the 500 MB archive file ceiling.
 * Resolves with the S3 object key tus wrote the file to (the tus "upload id",
 * see backend infrastructure/tus.service.ts's namingFunction).
 */
export function uploadViaTus(
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<string>; abort: () => void } {
  let upload: tus.Upload;

  const promise = new Promise<string>((resolve, reject) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    upload = new tus.Upload(file, {
      endpoint: TUS_ENDPOINT,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      chunkSize: 8 * 1024 * 1024,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => {
        // upload.url is the full tus resource URL — the trailing path segment
        // is the object key our namingFunction assigned (e.g. archive/tus/<uuid>.pdf).
        const key = decodeURIComponent(upload.url!.split("/api/uploads/tus/")[1] ?? "");
        if (!key) { reject(new Error("Could not determine uploaded file key")); return; }
        resolve(key);
      },
    });

    // Resume a previous, interrupted upload of this same file if one exists
    // (tus-js-client fingerprints by name/size/type/lastModified in localStorage).
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    });
  });

  return { promise, abort: () => upload?.abort() };
}
