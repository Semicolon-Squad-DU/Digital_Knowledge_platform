"use client";

import { useState } from "react";
import { Search, BookOpen, SlidersHorizontal } from "lucide-react";
import { useCatalogSearch } from "@/hooks/useLibrary";
import { CatalogCard } from "@/components/library/CatalogCard";
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
    <div className="page-container py-8">
      <PageHeader
        title="Library Catalog"
        subtitle="Search books, check availability, and manage your borrowing"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Library" }]}
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="search-bar flex-1">
          <Search className="search-bar-icon" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, or ISBN…"
            className="form-input pl-10"
            aria-label="Search library catalog"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Availability toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1" role="group" aria-label="Filter by availability">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParams((p) => ({ ...p, availability: opt.value, page: 1 }))}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                params.availability === opt.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
              aria-pressed={params.availability === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => {
            const active = (cat === "All" && !params.category) || params.category === cat;
            return (
              <button
                key={cat}
                onClick={() => setParams((p) => ({ ...p, category: cat === "All" ? "" : cat, page: 1 }))}
                className={cn("filter-chip", active && "filter-chip-active")}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4 min-h-[1.5rem]">
        {!isLoading && data && (
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{data.total.toLocaleString()}</span> books found
          </p>
        )}
        {isLoading && <p className="text-sm text-slate-400">Searching…</p>}
      </div>

      {/* Error */}
      {isError && (
        <div className="alert alert-danger mb-4" role="alert">
          Failed to load catalog. Please try again.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && data?.items?.length === 0 && (
        <EmptyState
          icon={<BookOpen size={26} />}
          title="No books found"
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

      {/* Results */}
      {!isLoading && data?.items && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.items.map((item: Parameters<typeof CatalogCard>[0]["item"]) => (
              <CatalogCard key={item.catalog_id} item={item} />
            ))}
          </div>

          <div className="mt-6">
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
  );
}
