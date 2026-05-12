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

      {/* Layout with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
        
        {/* Faceted Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-[#FFF8E7] border border-[#D4C4B7] rounded-md p-5 shadow-[0_4px_10px_rgba(122,40,40,0.05),0_1px_3px_rgba(0,0,0,0.02)]">
          <h2 className="font-heading text-lg text-[#7A2828] border-b border-[#D4C4B7]/60 pb-2 mb-4 uppercase tracking-widest text-sm">Refine Catalog</h2>
          
          {/* Availability Section */}
          <div className="mb-6">
            <h3 className="font-serif text-[#8B7355] text-xs uppercase tracking-wider mb-3">Availability</h3>
            <div className="flex flex-col gap-1.5" role="group" aria-label="Filter by availability">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setParams((p) => ({ ...p, availability: opt.value, page: 1 }))}
                  className={cn(
                    "text-left px-3 py-1.5 rounded-sm text-sm font-serif transition-all duration-200 border border-transparent",
                    params.availability === opt.value
                      ? "bg-[#7A2828]/5 border-[#7A2828]/20 text-[#7A2828] font-medium"
                      : "text-[#5a4634] hover:bg-[#D4C4B7]/10"
                  )}
                  aria-pressed={params.availability === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Section */}
          <div className="mb-6">
            <h3 className="font-serif text-[#8B7355] text-xs uppercase tracking-wider mb-3">Category</h3>
            <ul className="flex flex-col gap-1.5" role="group" aria-label="Filter by category">
              {CATEGORIES.map((cat) => {
                const active = (cat === "All" && !params.category) || params.category === cat;
                return (
                  <li key={cat}>
                    <button
                      onClick={() => setParams((p) => ({ ...p, category: cat === "All" ? "" : cat, page: 1 }))}
                      className={cn(
                        "w-full text-left flex items-center justify-between text-sm py-1 font-serif transition-colors",
                        active ? "text-[#7A2828] font-medium" : "text-[#5a4634] hover:text-[#7A2828]"
                      )}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-[#7A2828]" : "bg-transparent")} />
                        {cat}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Placeholder for Year Range */}
          <div>
            <h3 className="font-serif text-[#8B7355] text-xs uppercase tracking-wider mb-3">Year Range</h3>
            <div className="flex items-center gap-2 font-serif text-sm">
              <input type="number" placeholder="From" className="w-full bg-transparent border-b border-[#D4C4B7] focus:border-[#E69900] outline-none py-1 placeholder:text-[#D4C4B7] text-[#2c1e16]" />
              <span className="text-[#8B7355]">-</span>
              <input type="number" placeholder="To" className="w-full bg-transparent border-b border-[#D4C4B7] focus:border-[#E69900] outline-none py-1 placeholder:text-[#D4C4B7] text-[#2c1e16]" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          
          {/* Refined Search with Gold Glow */}
          <form onSubmit={handleSearch} className="relative group mb-6 flex gap-2">
            <div className="absolute inset-0 -m-1 rounded-full bg-[#E69900]/0 opacity-0 group-focus-within:opacity-100 group-focus-within:bg-[#E69900]/20 blur-md transition-all duration-700 pointer-events-none" />
            <div className="relative flex-1 flex items-center bg-[#FFF8E7] rounded-full border border-[#D4C4B7] px-4 shadow-sm group-focus-within:border-[#E69900] group-focus-within:shadow-[#E69900]/10 transition-all duration-300">
              <Search className="text-[#8B7355] mr-3" size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author, or ISBN…"
                className="w-full py-3 bg-transparent outline-none font-serif text-[#2c1e16] placeholder:text-[#D4C4B7] transition-all"
                aria-label="Search library catalog"
              />
            </div>
            <Button type="submit" className="relative z-10 rounded-full px-6 font-serif bg-[#7A2828] hover:bg-[#5E1F1F] text-[#FFF8E7] shadow-sm transform active:scale-95 transition-all">Search</Button>
          </form>

          {/* Results count */}
          <div className="flex items-center gap-2 mb-6 min-h-[1.5rem] pb-2 border-b border-[#D4C4B7]/40">
            {!isLoading && data && (
              <p className="text-sm text-[#5a4634] font-serif uppercase tracking-wide">
                <span className="font-semibold text-[#7A2828]">{data.total.toLocaleString()}</span> Volumes found
              </p>
            )}
            {isLoading && <p className="text-sm text-[#8B7355] font-serif animate-pulse">Searching the archives…</p>}
          </div>

          {/* Error */}
          {isError && (
            <div className="bg-[#A63C3C]/10 border border-[#A63C3C]/20 text-[#8C3232] rounded-md p-4 mb-4 font-serif text-sm">
              Failed to access the catalog catalogs. Please try again.
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && data?.items?.length === 0 && (
            <EmptyState
              icon={<BookOpen size={26} className="text-[#8B7355]" />}
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

          {/* Results */}
          {!isLoading && data?.items && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {data.items.map((item: Parameters<typeof CatalogCard>[0]["item"]) => (
                  <CatalogCard key={item.catalog_id} item={item} />
                ))}
              </div>

              <div className="mt-10 mb-4 pt-6 border-t border-[#D4C4B7]/40">
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
  );
}
