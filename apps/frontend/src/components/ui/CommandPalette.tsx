"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Archive, BookOpen, GraduationCap, FlaskConical, ArrowRight, Clock, Hash, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_LINKS = [
  { icon: Archive,       label: "Digital Archive",     href: "/archive",  desc: "Browse documents & media" },
  { icon: FlaskConical,  label: "Research", href: "/research", desc: "Papers & publications" },
  { icon: GraduationCap, label: "Student Showcase",    href: "/showcase", desc: "Student projects gallery" },
  { icon: BookOpen,      label: "Library Catalog",     href: "/library",  desc: "Books & borrowing" },
];

const RECENT_SEARCHES = [
  "machine learning thesis",
  "data structures textbook",
  "CSE final year projects",
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, QUICK_LINKS.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); onClose(); }
        else { router.push(QUICK_LINKS[selected].href); onClose(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, query, selected, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(1,4,9,0.5)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-md border overflow-hidden animate-scale-in"
        style={{
          background: "var(--color-canvas-default)",
          borderColor: "var(--color-border-default)",
          boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 border-b"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <Search size={16} style={{ color: "var(--color-fg-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                onClose();
              }
            }}
            placeholder="Search documents, books, research…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-fg-default)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--color-fg-muted)" }}>
              <X size={14} />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono border"
            style={{ background: "var(--color-canvas-subtle)", color: "var(--color-fg-muted)", borderColor: "var(--color-border-default)" }}
          >
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Recent searches */}
          {!query && (
            <div>
              <div
                className="px-3 py-2 text-xs font-semibold"
                style={{ color: "var(--color-fg-muted)", borderBottom: "1px solid var(--color-border-muted)" }}
              >
                Recent searches
              </div>
              {RECENT_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--color-canvas-subtle)]"
                  style={{ color: "var(--color-fg-default)" }}
                >
                  <Clock size={13} style={{ color: "var(--color-fg-muted)", flexShrink: 0 }} />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Quick navigation */}
          {!query && (
            <div>
              <div
                className="px-3 py-2 text-xs font-semibold"
                style={{ color: "var(--color-fg-muted)", borderBottom: "1px solid var(--color-border-muted)", borderTop: "1px solid var(--color-border-muted)" }}
              >
                Jump to
              </div>
              {QUICK_LINKS.map((link, i) => (
                <button
                  key={link.href}
                  onClick={() => { router.push(link.href); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                    selected === i ? "bg-[var(--color-accent-emphasis)] text-white" : "hover:bg-[var(--color-canvas-subtle)]"
                  )}
                  style={selected !== i ? { color: "var(--color-fg-default)" } : {}}
                >
                  <link.icon size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <div>
                    <p className="font-medium text-sm">{link.label}</p>
                    <p className="text-xs opacity-70">{link.desc}</p>
                  </div>
                  <ArrowRight size={13} className="ml-auto opacity-50" />
                </button>
              ))}
            </div>
          )}

          {/* Search results when typing */}
          {query && (
            <div>
              <button
                onClick={() => { router.push(`/search?q=${encodeURIComponent(query.trim())}`); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-canvas-subtle)]"
                style={{ color: "var(--color-fg-default)" }}
              >
                <Search size={13} style={{ color: "var(--color-fg-muted)", flexShrink: 0 }} />
                Search for <span className="font-semibold ml-1">&ldquo;{query}&rdquo;</span>
                <ArrowRight size={13} className="ml-auto" style={{ color: "var(--color-fg-muted)" }} />
              </button>

              <div style={{ borderTop: "1px solid var(--color-border-muted)" }}>
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => { router.push(`${link.href}?q=${encodeURIComponent(query)}`); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--color-canvas-subtle)]"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <Hash size={12} style={{ flexShrink: 0 }} />
                    Search in <span className="font-medium ml-1" style={{ color: "var(--color-fg-default)" }}>{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-3 py-2 text-xs border-t"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-fg-muted)", background: "var(--color-canvas-subtle)" }}
        >
          <span className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 rounded border font-mono text-[10px]" style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}>↑↓</kbd>
            navigate
            <kbd className="px-1 py-0.5 rounded border font-mono text-[10px]" style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}>↵</kbd>
            open
          </span>
          <span>DKP Search</span>
        </div>
      </div>
    </div>
  );
}
