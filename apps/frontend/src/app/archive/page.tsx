"use client";

import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Search, Upload, X, ChevronLeft, ChevronRight,
  Archive as ArchiveIcon, FileText,
} from "lucide-react";
import { useArchiveSearch, useDownloadArchiveItem } from "@/features/archive/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArchiveCard } from "@/features/archive/components/ArchiveCard";
import { UploadModal } from "@/features/archive/components/UploadModal";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  "General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other",
];
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
];
const FILE_TYPE_OPTIONS = [
  { value: "application/pdf", label: "PDF" },
  { value: "image/jpeg",      label: "Image" },
  { value: "audio/mpeg",      label: "Audio" },
  { value: "video/mp4",       label: "Video" },
];

export default function ArchivePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [uploadOpen,     setUploadOpen]     = useState(false);
  const [searchInput,    setSearchInput]    = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [currentPage,    setCurrentPage]    = useState(1);
  const [params, setParams] = useState({
    query: "", category: "", language: "", file_type: "", page: 1, limit: 20,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);
  const { mutateAsync: download }    = useDownloadArchiveItem();
  const isMobile  = useMediaQuery("(max-width: 767px)");
  const canUpload = _hasHydrated && isAuthenticated && ["archivist", "admin"].includes(user?.role ?? "");

  const handleSearch = () => {
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
    setCurrentPage(1);
  };
  const applyCategory = (cat: string) => { setFilterCategory(cat); setParams(p => ({ ...p, category: cat, page: 1 })); setCurrentPage(1); };
  const applyLanguage = (lang: string) => { setFilterLanguage(lang); setParams(p => ({ ...p, language: lang, page: 1 })); setCurrentPage(1); };
  const applyFileType = (type: string) => { setFilterFileType(type); setParams(p => ({ ...p, file_type: type, page: 1 })); setCurrentPage(1); };
  const handleClear   = () => {
    setSearchInput(""); setFilterCategory(""); setFilterLanguage(""); setFilterFileType("");
    setParams({ query: "", category: "", language: "", file_type: "", page: 1, limit: 20 }); setCurrentPage(1);
  };
  const handleDownload = async (id: string) => {
    try { const url = await download(id); window.open(url, "_blank"); }
    catch { toast.error("Download failed or access denied"); }
  };

  const hasFilters = !!(filterCategory || filterLanguage || filterFileType || params.query);
  const totalPages = data?.total_pages || 1;

  if (!_hasHydrated) return null;

  // Pill button
  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 12.5,
        fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        border: active ? "1.5px solid color-mix(in srgb, var(--avatar-theme-color, #6366f1) 35%, transparent)" : "1px solid #e5e7eb",
        background: active ? "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)" : "#fff",
        color: active ? "var(--avatar-theme-color, #4f46e5)" : "#6b7280",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#374151"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e7eb";  e.currentTarget.style.color = "#6b7280"; } }}
    >
      {label}
    </button>
  );

  return (
    <AppLayout topbarSearch={<div />}>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner with search ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "28px 18px 26px" : "36px 40px 34px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArchiveIcon size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{
                  fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#0f1117",
                  margin: 0, letterSpacing: "-0.03em",
                }}>
                  Archive
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Browse institutional documents, reports &amp; media
              </p>
            </div>

            {canUpload && (
              <button
                onClick={() => setUploadOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 16px",
                  background: "var(--avatar-theme-color, #1a1a2e)",
                  border: "none",
                  borderRadius: 9, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#fff",
                  transition: "opacity 0.2s", flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Upload size={14} /> Upload
              </button>
            )}
          </div>

          {/* Integrated search bar */}
          <div style={{
            display: "flex", alignItems: "center",
            background: "#fff", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            border: "1.5px solid #dde2ff",
          }}>
            <Search size={16} color="#9ca3af" style={{ marginLeft: 16, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by title, category, or keyword…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, padding: "13px 12px",
                color: "#1f2937", background: "transparent",
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setParams(p => ({ ...p, query: "", page: 1 })); setCurrentPage(1); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", color: "#9ca3af", display: "flex" }}
              >
                <X size={15} />
              </button>
            )}
            <button
              onClick={handleSearch}
              style={{
                margin: 5, padding: "9px 20px",
                background: "var(--avatar-theme-color, #1a1a2e)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Filter + results ───────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "18px 16px" : "24px 40px" }}>

          {/* Filter pill card */}
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: "14px 16px", marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {/* Category */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, width: 42 }}>
                Type
              </span>
              <Pill label="All" active={filterCategory === ""} onClick={() => applyCategory("")} />
              {CATEGORY_OPTIONS.map(c => (
                <Pill key={c} label={c} active={filterCategory === c} onClick={() => applyCategory(c)} />
              ))}
            </div>

            {/* Language + Format */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, width: 42 }}>
                Lang
              </span>
              <Pill label="All" active={filterLanguage === ""} onClick={() => applyLanguage("")} />
              {LANGUAGE_OPTIONS.map(l => (
                <Pill key={l.value} label={l.label} active={filterLanguage === l.value} onClick={() => applyLanguage(l.value)} />
              ))}

              <span style={{ width: 1, height: 20, background: "#e5e7eb", flexShrink: 0, margin: "0 4px" }} />

              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                Format
              </span>
              <Pill label="All" active={filterFileType === ""} onClick={() => applyFileType("")} />
              {FILE_TYPE_OPTIONS.map(t => (
                <Pill key={t.value} label={t.label} active={filterFileType === t.value} onClick={() => applyFileType(t.value)} />
              ))}

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20,
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#dc2626", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          {!isLoading && data && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <FileText size={13} color="#9ca3af" />
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>{data.total.toLocaleString()}</strong>{" "}
                document{data.total !== 1 ? "s" : ""} found
                {params.query && (
                  <span style={{ color: "#9ca3af" }}> for &ldquo;{params.query}&rdquo;</span>
                )}
              </span>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ padding: "16px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#991b1b", fontSize: 13 }}>
              Failed to load results. Please try again.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && (!data || data.items.length === 0) && (
            <div style={{
              textAlign: "center", padding: "60px 24px",
              background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: 14, background: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}>
                <ArchiveIcon size={26} color="#9ca3af" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>No documents found</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {hasFilters ? "Try adjusting your filters or search terms." : "No documents have been published yet."}
              </p>
              {hasFilters && (
                <button type="button" onClick={handleClear} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && data && data.items.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14, marginBottom: 28,
              }}>
                {data.items.map((item: any) => (
                  <ArchiveCard key={item.item_id} item={item} onDownload={handleDownload} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 16 }}>
                  <button
                    onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); setParams(s => ({ ...s, page: p })); }}
                    disabled={currentPage === 1}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} color="#6b7280" />
                  </button>

                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        onClick={() => { setCurrentPage(pg); setParams(s => ({ ...s, page: pg })); }}
                        style={{ width: 34, height: 34, borderRadius: 8, border: pg === currentPage ? "none" : "1px solid #e5e7eb", background: pg === currentPage ? "var(--avatar-theme-color, #1a1a2e)" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: pg === currentPage ? "#fff" : "#6b7280" }}
                      >
                        {pg}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); setParams(s => ({ ...s, page: p })); }}
                    disabled={currentPage >= totalPages}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: currentPage >= totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentPage >= totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} color="#6b7280" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </AppLayout>
  );
}
