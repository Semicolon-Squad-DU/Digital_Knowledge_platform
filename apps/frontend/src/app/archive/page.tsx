"use client";

import { useState } from "react";
import { Search, Upload, SlidersHorizontal, X, Archive } from "lucide-react";
import { useArchiveSearch, useDownloadArchiveItem } from "@/features/archive/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { ArchiveCard } from "@/features/archive/components/ArchiveCard";
import { UploadModal } from "@/features/archive/components/UploadModal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...["General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other"]
    .map((c) => ({ value: c, label: c })),
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
];

const FILE_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
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
    query: "", category: "", language: "", file_type: "", page: 1, limit: 20,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);
  const { mutateAsync: download } = useDownloadArchiveItem();

  const canUpload = isAuthenticated && ["archivist", "librarian", "admin"].includes(user?.role ?? "");
  const hasFilters = params.query || params.category || params.language || params.file_type;
  const activeFilterCount = [params.category, params.language, params.file_type].filter(Boolean).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await download(id);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  const clearFilters = () => {
    setParams({ query: "", category: "", language: "", file_type: "", page: 1, limit: 20 });
    setSearchInput("");
  };

  return (
    <div className="page-container py-8">
      <PageHeader
        title="Digital Archive"
        subtitle="Search and browse institutional documents and media"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Archive" }]}
        actions={
          canUpload ? (
            <Button onClick={() => setUploadOpen(true)} icon={<Upload size={15} />}>
              Upload Document
            </Button>
          ) : undefined
        }
      />

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="search-bar flex-1">
          <Search className="search-bar-icon" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search in Bangla or English…"
            className="form-input pl-10"
            aria-label="Search archive"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div
          id="filter-panel"
          className="surface p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-down"
        >
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
            label="File Type"
            value={params.file_type}
            onChange={(e) => setParams((p) => ({ ...p, file_type: e.target.value, page: 1 }))}
            options={FILE_TYPE_OPTIONS}
          />
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="w-full"
              icon={<X size={14} />}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4 min-h-[1.5rem]">
        <p className="text-sm text-slate-500">
          {isLoading
            ? "Searching…"
            : data
            ? `${data.total.toLocaleString()} result${data.total !== 1 ? "s" : ""}`
            : ""}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading results">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="alert alert-danger" role="alert">
          Failed to load results. Please try again.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && data?.items?.length === 0 && (
        <EmptyState
          icon={<Archive size={28} />}
          title="No documents found"
          description={hasFilters ? "Try adjusting your filters or search terms." : "No documents have been published yet."}
          action={hasFilters ? { label: "Clear filters", onClick: clearFilters, variant: "outline" } : undefined}
        />
      )}

      {/* Results */}
      {!isLoading && data?.items && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((item: Parameters<typeof ArchiveCard>[0]["item"]) => (
              <ArchiveCard key={item.item_id} item={item} onDownload={handleDownload} />
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

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
