"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, Upload, X, ChevronLeft, ChevronRight, Archive as ArchiveIcon,
} from "lucide-react";
import { useArchiveSearch, useDownloadArchiveItem } from "@/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { UploadModal } from "@/components/archive/UploadModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  "General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other"
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
];

const FILE_TYPE_OPTIONS = [
  { value: "application/pdf", label: "PDF" },
  { value: "image/jpeg", label: "Image" },
  { value: "audio/mpeg", label: "Audio" },
  { value: "video/mp4", label: "Video" },
];

export default function ArchivePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [params, setParams] = useState({
    query: "", category: "", language: "", file_type: "", page: 1, limit: 20,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);
  const { mutateAsync: download } = useDownloadArchiveItem();

  const canUpload = _hasHydrated && isAuthenticated && ["archivist", "admin"].includes(user?.role ?? "");

  const handleSearch = () => {
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    const newCategory = cat === "" ? "" : cat;
    setFilterCategory(newCategory);
    setParams((p) => ({
      ...p,
      category: newCategory,
      page: 1,
    }));
    setCurrentPage(1);
  };

  const handleLanguageChange = (lang: string) => {
    setFilterLanguage(lang);
    setParams((p) => ({
      ...p,
      language: lang,
      page: 1,
    }));
    setCurrentPage(1);
  };

  const handleFileTypeChange = (type: string) => {
    setFilterFileType(type);
    setParams((p) => ({
      ...p,
      file_type: type,
      page: 1,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilterCategory("");
    setFilterLanguage("");
    setFilterFileType("");
    setParams({ query: "", category: "", language: "", file_type: "", page: 1, limit: 20 });
    setCurrentPage(1);
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await download(id);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  const hasActiveFilters = filterCategory || filterLanguage || filterFileType || searchInput;

  if (!_hasHydrated) return null;

  const totalPages = data?.total_pages || 1;

  const topbarSearch = <div />; // Empty div to hide default search

  return (
    <AppLayout topbarSearch={topbarSearch}>
      <div style={{ padding:"28px 32px" }} className="archive-container">
          {/* Title Section */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }} className="archive-heading">
            <div>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                Archive Repository
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0 0" }}>
                Find institutional documents and media
              </p>
            </div>
            {canUpload && (
              <button
                onClick={() => setUploadOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  background: "var(--theme-gradient-160)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Upload size={14} />
                Upload
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}>
            <div style={{
              flex: 1,
              minWidth: 300,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "10px 12px",
            }}>
              <Search size={14} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#1f2937",
                  width: "100%",
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              style={{
                padding: "10px 16px",
                background: "var(--theme-gradient-160)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Search size={14} />
              Search
            </button>
          </div>

          {/* Filter Section - Redesigned */}
          <div style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px",
            marginBottom: 24,
          }}>
            {/* Category Filter */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 12 }}>
                Category
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", ...CATEGORY_OPTIONS].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat === "All" ? "" : cat)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: (cat === "All" ? filterCategory === "" : filterCategory === cat) ? "none" : "1px solid #d1d5db",
                      background: (cat === "All" ? filterCategory === "" : filterCategory === cat) ? "var(--avatar-theme-color)" : "#ffffff",
                      color: (cat === "All" ? filterCategory === "" : filterCategory === cat) ? "#ffffff" : "#6b7280",
                      fontSize: 13,
                      fontWeight: (cat === "All" ? filterCategory === "" : filterCategory === cat) ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!((cat === "All" ? filterCategory === "" : filterCategory === cat))) {
                        e.currentTarget.style.borderColor = "var(--avatar-theme-color)";
                        e.currentTarget.style.color = "var(--avatar-theme-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!((cat === "All" ? filterCategory === "" : filterCategory === cat))) {
                        e.currentTarget.style.borderColor = "#d1d5db";
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 12 }}>
                Language
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ value: "", label: "All" }, ...LANGUAGE_OPTIONS].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: filterLanguage === lang.value ? "none" : "1px solid #d1d5db",
                      background: filterLanguage === lang.value ? "var(--avatar-theme-color)" : "#ffffff",
                      color: filterLanguage === lang.value ? "#ffffff" : "#6b7280",
                      fontSize: 13,
                      fontWeight: filterLanguage === lang.value ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (filterLanguage !== lang.value) {
                        e.currentTarget.style.borderColor = "var(--avatar-theme-color)";
                        e.currentTarget.style.color = "var(--avatar-theme-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterLanguage !== lang.value) {
                        e.currentTarget.style.borderColor = "#d1d5db";
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Type Filter */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 12 }}>
                File Type
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ value: "", label: "All" }, ...FILE_TYPE_OPTIONS].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleFileTypeChange(type.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: filterFileType === type.value ? "none" : "1px solid #d1d5db",
                      background: filterFileType === type.value ? "var(--avatar-theme-color)" : "#ffffff",
                      color: filterFileType === type.value ? "#ffffff" : "#6b7280",
                      fontSize: 13,
                      fontWeight: filterFileType === type.value ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (filterFileType !== type.value) {
                        e.currentTarget.style.borderColor = "var(--avatar-theme-color)";
                        e.currentTarget.style.color = "var(--avatar-theme-color)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterFileType !== type.value) {
                        e.currentTarget.style.borderColor = "#d1d5db";
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: "10px 20px",
                    background: "#ffffff",
                    color: "#6b7280",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#9ca3af";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results Info */}
          {!isLoading && data && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
              {data.total.toLocaleString()} result{data.total !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div style={{
              padding: 16,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              fontSize: 13,
            }}>
              Failed to load results. Please try again.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!data || data.items.length === 0) && (
            <EmptyState
              icon={<ArchiveIcon size={32} />}
              title="No documents found"
              description={hasActiveFilters ? "Try adjusting your filters or search terms." : "No documents have been published yet."}
            />
          )}

          {/* Results Grid */}
          {!isLoading && data && data.items.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}>
                {data.items.map((item: any) => (
                  <ArchiveCard
                    key={item.item_id}
                    item={item}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 24,
                }}>
                  <button
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1));
                      setParams((p) => ({ ...p, page: Math.max(1, currentPage - 1) }));
                    }}
                    disabled={currentPage === 1}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={14} color="#6b7280" />
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          setParams((p) => ({ ...p, page }));
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          border: page === currentPage ? "none" : "1px solid #e5e7eb",
                          background: page === currentPage ? "var(--theme-gradient-160)" : "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          color: page === currentPage ? "#fff" : "#6b7280",
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                      setParams((p) => ({ ...p, page: Math.min(totalPages, currentPage + 1) }));
                    }}
                    disabled={currentPage >= totalPages}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: currentPage >= totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={14} color="#6b7280" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </AppLayout>
  );
}
