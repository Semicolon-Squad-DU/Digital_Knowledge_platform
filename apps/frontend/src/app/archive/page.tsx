"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Upload, ChevronLeft, ChevronRight, FileText,
  Calendar, Building2, Lock, Globe, KeyRound,
} from "lucide-react";
import { useArchiveSearch, useDownloadArchiveItem } from "@/features/archive/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, accessVisual } from "@/components/design/dkpTheme";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
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
  { value: "image/jpeg", label: "Image" },
  { value: "audio/mpeg", label: "Audio" },
  { value: "video/mp4", label: "Video" },
];

function TierBadge({ tier }: { tier?: string }) {
  const v = accessVisual(tier);
  const Icon = tier === "restricted" ? Lock : tier === "public" ? Globe : KeyRound;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "4px 8px", borderRadius: 4, background: v.bg, color: v.color, border: `1px solid ${v.border}`,
    }}>
      <Icon size={12} /> {v.label}
    </span>
  );
}

export default function ArchivePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [params, setParams] = useState({
    query: "", category: "", language: "", file_type: "",
    date_from: "", date_to: "", tags: "", page: 1, limit: 12,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);
  const { mutateAsync: download } = useDownloadArchiveItem();
  const canUpload = _hasHydrated && isAuthenticated && user?.role === "archivist";

  const applySearch = (q: string) => {
    setSearchInput(q);
    setParams((p) => ({ ...p, query: q, page: 1 }));
  };

  const applyCategory = (cat: string) => {
    const next = filterCategory === cat ? "" : cat;
    setFilterCategory(next);
    setParams((p) => ({ ...p, category: next, page: 1 }));
  };

  const applyLanguage = (lang: string) => {
    const next = filterLanguage === lang ? "" : lang;
    setFilterLanguage(next);
    setParams((p) => ({ ...p, language: next, page: 1 }));
  };

  const applyFileType = (type: string) => {
    const next = filterFileType === type ? "" : type;
    setFilterFileType(next);
    setParams((p) => ({ ...p, file_type: next, page: 1 }));
  };

  const applyYears = (from: string, to: string) => {
    setYearFrom(from);
    setYearTo(to);
    setParams((p) => ({
      ...p,
      date_from: from ? `${from}-01-01` : "",
      date_to: to ? `${to}-12-31` : "",
      page: 1,
    }));
  };

  const handleClear = () => {
    setSearchInput("");
    setFilterCategory("");
    setFilterLanguage("");
    setFilterFileType("");
    setYearFrom("");
    setYearTo("");
    setParams({
      query: "", category: "", language: "", file_type: "",
      date_from: "", date_to: "", tags: "", page: 1, limit: 12,
    });
  };

  const handleDownload = async (id: string) => {
    if (!isAuthenticated) { toast.error("Please sign in to download documents."); return; }
    try {
      const url = await download(id);
      // Content-Disposition: attachment is already set on this URL, so a
      // click-through anchor downloads it in place — window.open would spawn
      // an extra (empty) tab alongside the download.
      const link = document.createElement("a");
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  const totalPages = data?.total_pages || 1;
  const total = data?.total ?? 0;
  const page = params.page;
  const limit = params.limit;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const items = [...(data?.items ?? [])].sort((a: any, b: any) => {
    if (sortBy === "title_asc") return String(a.title_en || "").localeCompare(String(b.title_en || ""));
    if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (!_hasHydrated) return null;

  const inputStyle: CSSProperties = {
    width: "100%", padding: "9px 12px 9px 36px", border: `1px solid ${C.lineStrong}`,
    borderRadius: 6, background: C.white, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box",
  };

  const navSearch = (
    <div style={{ position: "relative" }}>
      <Search size={16} color={C.body} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
      <input
        type="text"
        placeholder="Search archive..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applySearch(searchInput)}
        style={{
          width: 220, padding: "8px 12px 8px 34px", border: `1px solid ${C.lineStrong}`,
          borderRadius: 6, background: C.white, fontSize: 13, color: C.ink, outline: "none",
        }}
      />
    </div>
  );

  return (
    <CollectionShell active="Archive" navSearch={navSearch}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(28px, 4vw, 48px) clamp(16px, 4vw, 64px)", display: "grid", gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)", gap: 24 }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 900px) {
            .dkp-archive-grid { grid-template-columns: 1fr !important; }
            .dkp-archive-cards { grid-template-columns: 1fr !important; }
          }
        `}} />

        {/* Sidebar */}
        <aside style={{ background: C.sidebar, padding: 24, borderRadius: 10, border: `1px solid ${C.lineStrong}`, height: "fit-content", position: "sticky", top: 88 }}>
          <h2 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.body, margin: "0 0 16px" }}>
            Search &amp; Filter
          </h2>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <Search size={15} color={C.body} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Refine search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch(searchInput)}
              style={inputStyle}
            />
          </div>

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Document Type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.body }}>
                  <input type="checkbox" checked={filterCategory === c} onChange={() => applyCategory(c)} style={{ accentColor: C.accent }} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Language</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LANGUAGE_OPTIONS.map((l) => (
                <label key={l.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.body }}>
                  <input type="checkbox" checked={filterLanguage === l.value} onChange={() => applyLanguage(l.value)} style={{ accentColor: C.accent }} />
                  {l.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Format</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FILE_TYPE_OPTIONS.map((t) => (
                <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.body }}>
                  <input type="checkbox" checked={filterFileType === t.value} onChange={() => applyFileType(t.value)} style={{ accentColor: C.accent }} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Date Range</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                placeholder="YYYY"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                onBlur={() => applyYears(yearFrom, yearTo)}
                style={{ ...inputStyle, padding: "8px 10px", width: "100%" }}
              />
              <span style={{ color: C.body }}>–</span>
              <input
                type="number"
                placeholder="YYYY"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                onBlur={() => applyYears(yearFrom, yearTo)}
                style={{ ...inputStyle, padding: "8px 10px", width: "100%" }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            style={{
              width: "100%", padding: "10px 14px", background: C.white, border: `1px solid ${C.ink}`,
              color: C.ink, borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            Reset Filters
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={() => router.push("/archive/upload")}
              style={{
                width: "100%", marginTop: 12, padding: "10px 14px", background: C.ink, border: "none",
                color: C.white, borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Upload size={14} /> Upload Document
            </button>
          )}
        </aside>

        {/* Results */}
        <section className="dkp-archive-grid" style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: "clamp(26px, 3.2vw, 32px)", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
                Institutional Archives
              </h1>
              <p style={{ fontSize: 14, color: C.body, margin: 0 }}>
                {isLoading ? "Loading documents…" : `Showing ${from} – ${to} of ${total.toLocaleString()} documents`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: C.body }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: C.ink, cursor: "pointer", outline: "none" }}
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="dkp-archive-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          )}

          {isError && (
            <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
              Failed to load results. Please try again.
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 24px", background: C.white, borderRadius: 12, border: `1px solid ${C.lineStrong}` }}>
              <FileText size={28} color={C.body} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>No documents found</p>
              <p style={{ fontSize: 14, color: C.body, margin: 0 }}>Try adjusting your filters or search terms.</p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <>
              <div className="dkp-archive-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {items.map((item: any) => (
                  <Link
                    key={item.item_id}
                    href={`/archive/${item.item_id}`}
                    className="dkp-coll-card"
                    style={{
                      display: "flex", flexDirection: "column", gap: 14, padding: 22,
                      background: "rgba(255,255,255,0.9)", border: `1px solid ${C.lineStrong}`,
                      borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 24px rgba(26,26,46,0.05)",
                      minHeight: 220,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: C.band, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={18} />
                      </div>
                      <TierBadge tier={item.access_tier} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 8px", lineHeight: 1.3 }}>
                        {item.title_en}
                      </h3>
                      <p style={{
                        fontSize: 13, color: C.body, margin: 0, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                      }}>
                        {item.description || item.title_bn || "Institutional archive document."}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.body }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} /> {item.created_at ? formatDate(item.created_at) : "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Building2 size={13} /> {item.category || "General"}
                      </span>
                      {item.status === "published" && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleDownload(item.item_id); }}
                          style={{ marginLeft: "auto", background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
                  <button
                    onClick={() => setParams((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
                    disabled={page === 1}
                    style={{ width: 40, height: 40, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.white, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setParams((s) => ({ ...s, page: pg }))}
                      style={{
                        width: 40, height: 40, borderRadius: 6,
                        border: pg === page ? "none" : `1px solid ${C.lineStrong}`,
                        background: pg === page ? C.ink : C.white,
                        color: pg === page ? C.white : C.body,
                        fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {pg}
                    </button>
                  ))}
                  {totalPages > 5 && (
                    <>
                      <span style={{ color: C.body }}>…</span>
                      <button
                        onClick={() => setParams((s) => ({ ...s, page: totalPages }))}
                        style={{ width: 40, height: 40, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.white, color: C.body, fontWeight: 700, cursor: "pointer" }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setParams((s) => ({ ...s, page: Math.min(totalPages, s.page + 1) }))}
                    disabled={page >= totalPages}
                    style={{ width: 40, height: 40, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.white, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </CollectionShell>
  );
}
