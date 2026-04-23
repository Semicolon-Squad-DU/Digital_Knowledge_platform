"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  persistent?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, size = "md", persistent = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !persistent) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, persistent]);

  if (!isOpen) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(1,4,9,0.5)" }}
      onClick={(e) => { if (!persistent && e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={cn("w-full rounded-md border animate-scale-in overflow-hidden", sizes[size])}
        style={{
          background: "var(--color-canvas-default)",
          borderColor: "var(--color-border-default)",
          boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-canvas-subtle)" }}
          >
            <div>
              <h2 id="modal-title" className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>
                {title}
              </h2>
              {description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md transition-colors hover:bg-[var(--color-canvas-inset)]"
              style={{ color: "var(--color-fg-muted)" }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading = false,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description?: string;
  confirmLabel?: string; cancelLabel?: string;
  variant?: "danger" | "primary"; loading?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm font-medium rounded-md border transition-colors hover:bg-[var(--color-canvas-subtle)]"
          style={{ color: "var(--color-fg-default)", borderColor: "var(--color-border-default)" }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md text-white border border-transparent transition-colors disabled:opacity-60",
            variant === "danger"
              ? "bg-[var(--color-danger-emphasis)] hover:bg-[#a40e26]"
              : "bg-[#1f883d] hover:bg-[#1a7f37]"
          )}
        >
          {loading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
