"use client";

import { useState } from "react";
import { Upload, SlidersHorizontal, X, Archive } from "lucide-react";
import { useArchiveSearch } from "@/features/archive/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { ArchiveVaultCard } from "@/features/archive/components/ArchiveVaultCard";
import { UploadModal } from "@/features/archive/components/UploadModal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import type { ArchiveItem } from "@dkp/shared";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  ...["General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other"].map((c) => ({
    value: c,
    label: c,
  })),
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "All languages" },
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
];

const FILE_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "application/pdf", label: "PDF" },
  { value: "image/jpeg", label: "Image" },
  { value: "audio/mpeg", label: "Audio" },
  { value: "video/mp4", label: "Video" },
];

export default function ArchivePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState({
    query: "",
    category: "",
    language: "",
    file_type: "",
    page: 1,
    limit: 12,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);

  const canUpload = isAuthenticated && ["archivist", "librarian", "admin"].includes(user?.role ?? "");
  const hasFilters = Boolean(params.query || params.category || params.language || params.file_type);
  const activeFilterCount = [params.category, params.language, params.file_type].filter(Boolean).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
  };

  const clearFilters = () => {
    setParams({ query: "", category: "", language: "", file_type: "", page: 1, limit: 12 });
    setSearchInput("");
  };

  return (
    <div className="bg-surface-container-lowest min-h-full">
      <header className="w-full border-b-2 border-outline-variant py-10 md:py-12 px-4 sm:px-6 flex flex-col items-center justify-center bg-surface relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" aria-hidden />
        <p className="text-xs font-mono tracking-widest text-on-surface-variant uppercase mb-3 border-b border-outline-variant pb-2 inline-block">
          Daily digest · University archive · Open catalog
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tighter text-on-surface uppercase text-center mb-6 leading-none">
          The Archive Gazette
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 bg-surface-container px-3 sm:px-4 py-2 border border-outline-variant shadow-[2px_2px_0_0_#27272a]">
          <span className="material-symbols-outlined text-tertiary text-xl">fork_right</span>
          <span className="text-xs sm:text-sm font-mono text-on-surface-variant">branch:</span>
          <select
            className="bg-transparent border-none text-on-surface font-bold text-xs sm:text-sm focus:ring-0 cursor-pointer appearance-none pr-6 font-mono max-w-[12rem] sm:max-w-none"
            aria-label="Archive branch"
            defaultValue="main"
          >
            <option value="main">main</option>
            <option value="v1-legacy">v1-legacy</option>
            <option value="theses">theses</option>
          </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
        <aside className={`w-full lg:w-64 shrink-0 space-y-8 ${showFilters ? "" : "hidden lg:block"}`}>
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 border-b border-outline-variant pb-2">
              Quick filters
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">Narrow results by classification metadata.</p>
            <div className="space-y-4">
              <Select
                label="Category"
                value={params.category}
                onChange={(e) => setParams((p) => ({ ...p, category: e.target.value, page: 1 }))}
                options={CATEGORY_OPTIONS}
              />
              <Select
                label="Language"
                value={params.language}
                onChange={(e) => setParams((p) => ({ ...p, language: e.target.value, page: 1 }))}
                options={LANGUAGE_OPTIONS}
              />
              <Select
                label="File type"
                value={params.file_type}
                onChange={(e) => setParams((p) => ({ ...p, file_type: e.target.value, page: 1 }))}
                options={FILE_TYPE_OPTIONS}
              />
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters} icon={<X size={14} />}>
                Clear filters
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-on-surface tracking-tight">Archive index</h2>
              <p className="text-sm text-on-surface-variant mt-1 font-mono">
                {isLoading ? "Searching…" : data ? `${data.total.toLocaleString()} entr${data.total !== 1 ? "ies" : "y"}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canUpload && (
                <Button onClick={() => setUploadOpen(true)} icon={<Upload size={15} />} className="bg-primary text-on-primary border-primary hover:opacity-90">
                  New entry
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="border-outline-variant text-on-surface lg:hidden"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                search
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search in Bangla or English…"
                className="w-full bg-surface-container border border-outline-variant rounded-md py-2.5 pl-11 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Search archive"
              />
            </div>
            <Button type="submit" className="shrink-0 bg-primary text-on-primary border-primary hover:opacity-90">
              Search
            </Button>
          </form>

          {isError && (
            <div className="rounded-lg border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
              Failed to load results. Please try again.
            </div>
          )}

          {isLoading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading results">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!isLoading && !isError && data?.items?.length === 0 && (
            <EmptyState
              icon={<Archive size={28} />}
              title="No documents found"
              description={hasFilters ? "Try adjusting your filters or search terms." : "No documents have been published yet."}
              action={hasFilters ? { label: "Clear filters", onClick: clearFilters, variant: "outline" } : undefined}
            />
          )}

          {!isLoading && data?.items && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                {data.items.map((item: ArchiveItem) => (
                  <ArchiveVaultCard key={item.item_id} item={item} />
                ))}
              </div>
              <div className="pt-4">
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

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
