"use client";

import { useEffect, useState } from "react";
import { FileText, Music, Image as ImageIcon, File, Lock } from "lucide-react";
import api from "@/lib/api";

interface ArchiveMediaViewerProps {
  itemId: string;
  fileType: string;
  canView: boolean;
}

function kindOf(fileType: string): "pdf" | "video" | "audio" | "image" | "text" | "other" {
  if (fileType === "application/pdf") return "pdf";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "text/plain") return "text";
  return "other";
}

/** In-browser preview for archive items — PDF/video/audio/image inline, with a
 * download-only fallback for formats that can't render in a browser tab. */
export function ArchiveMediaViewer({ itemId, fileType, canView }: ArchiveMediaViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const kind = kindOf(fileType);

  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    api.get(`/archive/${itemId}/download`)
      .then(({ data }) => { if (!cancelled) setUrl(data.data.url); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [itemId, canView]);

  const shellStyle: React.CSSProperties = {
    borderRadius: 12,
    background: "#f9f9ff",
    border: "1px solid #c8c5cd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (!canView) {
    return (
      <div style={{ ...shellStyle, height: 200 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <Lock size={28} color="#c8c5cd" style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#47464c", margin: 0 }}>Preview unavailable</p>
          <p style={{ fontSize: 12, color: "#78767d", marginTop: 4 }}>This document isn&apos;t published yet or you don&apos;t have access.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ ...shellStyle, height: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #0D47A1", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#555f6d" }}>Loading preview…</p>
        </div>
      </div>
    );
  }

  if (failed || !url) {
    return (
      <div style={{ ...shellStyle, height: 200 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <File size={28} color="#c8c5cd" style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#47464c", margin: 0 }}>Preview unavailable</p>
        </div>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c8c5cd", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <iframe src={url} style={{ width: "100%", height: 560, border: "none" }} title="Document preview" />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c8c5cd", background: "#000" }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video controls style={{ width: "100%", maxHeight: 480, display: "block" }} src={url} />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div style={{ ...shellStyle, height: 120, flexDirection: "column", gap: 10, padding: 20 }}>
        <Music size={22} color="#78767d" />
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls style={{ width: "100%" }} src={url} />
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c8c5cd", background: "#f9f9ff", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Document preview" style={{ maxWidth: "100%", maxHeight: 560, display: "inline-block" }} />
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c8c5cd" }}>
        <iframe src={url} style={{ width: "100%", height: 400, border: "none", background: "#fff" }} title="Text preview" />
      </div>
    );
  }

  return (
    <div style={{ ...shellStyle, height: 160 }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        {fileType.includes("word") || fileType.includes("presentation") ? (
          <FileText size={28} color="#c8c5cd" style={{ margin: "0 auto 10px" }} />
        ) : (
          <ImageIcon size={28} color="#c8c5cd" style={{ margin: "0 auto 10px" }} />
        )}
        <p style={{ fontSize: 13, fontWeight: 600, color: "#47464c", margin: 0 }}>No in-browser preview for this file type</p>
        <p style={{ fontSize: 12, color: "#78767d", marginTop: 4 }}>Use the Download button below to view it.</p>
      </div>
    </div>
  );
}
