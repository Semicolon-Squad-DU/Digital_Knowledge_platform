"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { useCatalogSearch } from "@/features/library/hooks/useLibrary";
import { CatalogCard } from "@/features/library/components/CatalogCard";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Textbook", "Reference", "Novel", "Journal", "Magazine", "Thesis"];

const AVAILABILITY_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "available", label: "Available" },
  { value: "on_loan",   label: "On Loan" },
] as const;

export default function LibraryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState({
    query: "",
    category: "",
    availability: "all" as "all" | "available" | "on_loan",
    page: 1,
    limit: 20,
  });

  const { data, isLoading, isError } = useCatalogSearch(params);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
  };

  return (
    <div className="bg-background min-h-full">
      <div className="page-container py-8">
        <PageHeader
          title="Library Catalog"
          subtitle="Search books, check availability, and manage your borrowing"
          breadcrumb={[{ label: "Home", href: "/" }, { label: "Library" }]}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          <aside className="w-full lg:w-64 shrink-0 bg-surface-container border border-outline-variant rounded-lg p-5">
            <h2 className="font-display text-sm font-bold text-on-surface border-b border-outline-variant pb-2 mb-4 uppercase tracking-widest">
              Refine catalog
            </h2>

            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-on-surface-variant mb-3 font-mono">Availability</h3>
              <div className="flex flex-col gap-1.5" role="group" aria-label="Filter by availability">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, availability: opt.value, page: 1 }))}
                    className={cn(
                      "text-left px-3 py-1.5 rounded-md text-sm transition-all border border-transparent",
                      params.availability === opt.value
                        ? "bg-secondary-container text-primary font-semibold border-outline-variant"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    )}
                    aria-pressed={params.availability === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-on-surface-variant mb-3 font-mono">Category</h3>
              <ul className="flex flex-col gap-1.5" role="group" aria-label="Filter by category">
                {CATEGORIES.map((cat) => {
                  const active = (cat === "All" && !params.category) || params.category === cat;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, category: cat === "All" ? "" : cat, page: 1 }))}
                        className={cn(
                          "w-full text-left flex items-center gap-2 text-sm py-1.5 rounded-md transition-colors",
                          active ? "text-primary font-semibold bg-surface-container-high" : "text-on-surface-variant hover:text-on-surface"
                        )}
                        aria-pressed={active}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", active ? "bg-primary" : "bg-outline-variant")} />
                        {cat}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-on-surface-variant mb-3 font-mono">Year range</h3>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  placeholder="From"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-on-surface-variant">–</span>
                <input
                  type="number"
                  placeholder="To"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="relative flex-1 flex items-center bg-surface-container border border-outline-variant rounded-full px-4 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                <Search className="text-on-surface-variant mr-3 shrink-0" size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by title, author, or ISBN…"
                  className="w-full py-3 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant"
                  aria-label="Search library catalog"
                />
              </div>
              <Button
                type="submit"
                className="shrink-0 rounded-full px-6 bg-primary text-on-primary border-primary hover:opacity-90"
              >
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2 mb-6 min-h-[1.5rem] pb-2 border-b border-outline-variant">
              {!isLoading && data && (
                <p className="text-sm text-on-surface-variant font-mono uppercase tracking-wide">
                  <span className="font-semibold text-on-surface">{data.total.toLocaleString()}</span> volumes found
                </p>
              )}
              {isLoading && <p className="text-sm text-on-surface-variant animate-pulse">Searching the catalog…</p>}
            </div>

            {isError && (
              <div className="rounded-lg border border-error/40 bg-error-container/20 text-error px-4 py-3 mb-4 text-sm" role="alert">
                Failed to access the catalog. Please try again.
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!isLoading && !isError && data?.items?.length === 0 && (
              <EmptyState
                icon={<BookOpen size={26} className="text-on-surface-variant" />}
                title="No volumes found"
                description="Try different search terms or clear the filters."
                action={{
                  label: "Clear filters",
                  onClick: () => {
                    setParams({ query: "", category: "", availability: "all", page: 1, limit: 20 });
                    setSearchInput("");
                  },
                  variant: "outline",
                }}
              />
            )}

            {!isLoading && data?.items && data.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {data.items.map((item: Parameters<typeof CatalogCard>[0]["item"]) => (
                    <CatalogCard key={item.catalog_id} item={item} />
                  ))}
                </div>

                <div className="mt-10 mb-4 pt-6 border-t border-outline-variant">
                  <Pagination
                    page={params.page}
                    totalPages={data.total_pages}
                    total={data.total}
                    limit={params.limit}
                    onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
