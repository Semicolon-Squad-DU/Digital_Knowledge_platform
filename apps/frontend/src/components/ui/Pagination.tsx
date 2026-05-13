import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Show total results count */
  total?: number;
  limit?: number;
}

export function Pagination({ page, totalPages, onPageChange, className, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = total && limit ? (page - 1) * limit + 1 : null;
  const end = total && limit ? Math.min(page * limit, total) : null;

  // Build page numbers to show (max 5 visible)
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 font-body", className)}>
      {/* Count */}
      {total != null && start != null && end != null ? (
        <p className="text-sm text-on-surface-variant uppercase tracking-wider">
          Volumes <span className="font-medium text-on-surface">{start}–{end}</span> of{" "}
          <span className="font-medium text-on-surface">{total.toLocaleString()}</span>
        </p>
      ) : (
        <span />
      )}

      {/* Controls */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:text-on-surface-variant transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-outline text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "min-w-[2.5rem] h-9 px-2 text-sm transition-all duration-300 flex items-center justify-center font-medium",
                p === page
                  ? "text-primary font-bold text-lg relative before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-4 before:h-0.5 before:bg-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-sm"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:text-on-surface-variant transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
