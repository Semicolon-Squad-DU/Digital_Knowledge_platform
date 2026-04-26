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
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Count */}
      {total != null && start != null && end != null ? (
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{start}–{end}</span> of{" "}
          <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
        </p>
      ) : (
        <span />
      )}

      {/* Controls */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
