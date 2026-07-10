"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
}

/**
 * Webcam-based barcode/QR scanner using ZXing's multi-format reader — handles
 * both QR codes and 1D barcodes (Code128/EAN) printed on library items.
 * Falls back gracefully (camera-unavailable message) so the caller's manual
 * entry field remains the fallback path, per the lending flow's scan-fails case.
 */
export function BarcodeScannerModal({ isOpen, onClose, onDetected, title = "Scan Barcode / QR Code" }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              onDetected(result.getText());
              controlsRef.current?.stop();
              onClose();
            }
            // NotFoundException fires continuously while no code is in frame — expected, ignore.
            void err;
          }
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch {
        if (!cancelled) setError("Camera unavailable. Check permissions or use manual entry below.");
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [isOpen, onClose, onDetected]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-3">
        {error ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CameraOff size={28} className="text-red-500" />
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "4 / 3" }}>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <ScanLine size={200} className="text-white/40" strokeWidth={0.5} />
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500 text-center">
          Point the camera at a book&apos;s barcode or QR label. Detection is automatic.
        </p>
      </div>
    </Modal>
  );
}
