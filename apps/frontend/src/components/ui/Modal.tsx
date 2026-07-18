"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  persistent?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, size = "md", persistent = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  if (!isOpen || !mounted) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 md:p-8 backdrop-blur-sm transition-all duration-300 animate-fade-in"
      style={{ background: "radial-gradient(circle, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%)" }}
      onClick={(e) => { if (!persistent && e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={cn("w-full rounded-md border animate-scale-in overflow-hidden flex flex-col", sizes[size])}
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f1f3ff 60%, #f1f3ff 100%)",
          borderColor: "var(--color-border-default)",
          boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
          margin: "auto",
          maxHeight: "calc(100vh - 80px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-start justify-between gap-3 px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: "var(--color-border-default)", background: "var(--color-canvas-subtle)" }}
          >
            <div className="flex-1 min-w-0">
              <h2 id="modal-title" className="text-lg font-extrabold tracking-tight" style={{ color: "var(--color-fg-default)" }}>
                {title}
              </h2>
              {description && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-md transition-colors hover:bg-[var(--color-canvas-inset)]"
              style={{ color: "var(--color-fg-muted)" }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
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
  const Icon = variant === "danger" ? AlertTriangle : HelpCircle;

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} size="sm">
      <div className="flex gap-4">
        <div
          className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            background: variant === "danger" ? "rgba(220, 38, 38, 0.1)" : "rgba(37, 99, 235, 0.1)",
          }}
        >
          <Icon size={22} color={variant === "danger" ? "#dc2626" : "#0D47A1"} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-base font-bold" style={{ color: "var(--color-fg-default)" }}>{title}</h3>
          {description && (
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{description}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2.5 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors hover:bg-[var(--color-canvas-subtle)] disabled:opacity-60"
          style={{ color: "var(--color-fg-default)", borderColor: "var(--color-border-default)" }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg text-white border border-transparent transition-colors disabled:opacity-60 inline-flex items-center gap-2",
            variant === "danger"
              ? "bg-[var(--color-danger-emphasis)] hover:bg-[#a40e26]"
              : "bg-[#1f883d] hover:bg-[#1a7f37]"
          )}
        >
          {loading && (
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          )}
          {loading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
