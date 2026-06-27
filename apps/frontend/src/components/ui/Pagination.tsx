import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  total?: number;
  limit?: number;
}

export function Pagination({ page, totalPages, onPageChange, className, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = total && limit ? (page - 1) * limit + 1 : null;
  const end   = total && limit ? Math.min(page * limit, total) : null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {total != null && start != null && end != null ? (
        <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
          Showing{" "}
          <span className="font-medium" style={{ color: "var(--color-fg-default)" }}>{start}–{end}</span>
          {" "}of{" "}
          <span className="font-medium" style={{ color: "var(--color-fg-default)" }}>{total.toLocaleString()}</span>
        </p>
      ) : <span />}

      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--color-canvas-subtle)]"
          style={{ color: "var(--color-fg-muted)" }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm select-none" style={{ color: "var(--color-fg-subtle)" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className="min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors"
              style={p === page
                ? { background: "var(--gradient-accent)", color: "#fff" }
                : { color: "var(--color-fg-muted)", background: "transparent" }
              }
              onMouseEnter={e => { if (p !== page) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-canvas-subtle)"; }}
              onMouseLeave={e => { if (p !== page) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--color-canvas-subtle)]"
          style={{ color: "var(--color-fg-muted)" }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
