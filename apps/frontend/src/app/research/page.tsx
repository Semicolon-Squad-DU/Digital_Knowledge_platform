"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, FlaskConical, ExternalLink, Calendar, FileText, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, getAccessTierBadge } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "journal",    label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis",     label: "Thesis" },
  { value: "dataset",    label: "Dataset" },
  { value: "report",     label: "Report" },
];

const PILL: Record<string, { bg: string; color: string }> = {
  published:       { bg: "#e6f4ea", color: "#1e7e34" },
  journal:         { bg: "#e8f0fe", color: "#1a56db" },
  journal_article: { bg: "#e8f0fe", color: "#1a56db" },
  conference:      { bg: "#e8f0fe", color: "#1a56db" },
  conference_paper:{ bg: "#e8f0fe", color: "#1a56db" },
  thesis:          { bg: "#f3f4f6", color: "#6b7280" },
  dataset:         { bg: "#e6f4ea", color: "#1e7e34" },
  report:          { bg: "#f3f4f6", color: "#6b7280" },
};

function ResearchCard({ item, onView }: {
  item: {
    output_id: string; title: string; abstract?: string;
    authors?: Array<{ name: string }>; output_type: string;
    published_date: string; journal_name?: string; doi?: string;
    dkp_identifier: string; access_tier?: string;
    uploaded_by?: string; uploader_name?: string;
  };
  onView: (id: string) => void;
}) {
  const typePill = PILL[item.output_type] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const tierBadge = item.access_tier ? getAccessTierBadge(item.access_tier) : null;
  return (
    <div
      onClick={() => onView(item.output_id)}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
        padding: 18, cursor: "pointer",
        display: "flex", gap: 14,
        boxShadow: "0 1px 2px rgba(17,24,39,0.03)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(17,24,39,0.09)"; e.currentTarget.style.borderColor = "#d1d5db"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.03)"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 11, background: "var(--avatar-theme-color, #111827)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <FlaskConical size={20} color="#ffffff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.04em", padding: "3px 9px", borderRadius: 6, background: typePill.bg, color: typePill.color,
          }}>
            {item.output_type}
          </span>
          {tierBadge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tierBadge.color}`}>
              {tierBadge.label}
            </span>
          )}
          {item.published_date && (
            <span style={{ fontSize: 11.5, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} /> {formatDate(item.published_date)}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px", lineHeight: 1.4 }}>
          {item.title}
        </p>
        {item.authors && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px" }}>
            {item.authors.map(a => a.name).join(", ")}
          </p>
        )}
        {item.abstract && (
          <p style={{
            fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
          }}>
            {item.abstract}
          </p>
        )}
      </div>
      {item.doi && (
        <a
          href={`https://doi.org/${item.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700,
            color: "#1a56db", textDecoration: "none", flexShrink: 0, alignSelf: "flex-start",
            padding: "5px 10px", borderRadius: 999, background: "#eff6ff",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#dbeafe")}
          onMouseLeave={e => (e.currentTarget.style.background = "#eff6ff")}
        >
          DOI <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [params, setParams]       = useState({ q: "", output_type: "", page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["research", params],
    queryFn: async () => {
      const { data } = await api.get("/research", { params });
      return data.data;
    },
  });

  const isMobile  = useMediaQuery("(max-width: 767px)");
  const canUpload = isAuthenticated && user?.role === "researcher";

  const handleSearch = () => setParams(p => ({ ...p, q: searchInput, page: 1 }));
  const clearSearch  = () => { setSearchInput(""); setParams(p => ({ ...p, q: "", page: 1 })); };

  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button" onClick={onClick}
      style={{
        padding: "6px 16px", borderRadius: 999, fontSize: 12.5,
        fontWeight: active ? 700 : 600, cursor: "pointer", whiteSpace: "nowrap",
        border: active ? "1.5px solid transparent" : "1px solid #e5e7eb",
        background: active ? "var(--avatar-theme-color, #1a1a2e)" : "#fff",
        color: active ? "#fff" : "#6b7280",
        boxShadow: active ? "0 2px 8px color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 35%, transparent)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-1px)";
        if (!active) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#111827"; e.currentTarget.style.background = "#f9fafb"; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!active) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "#fff"; }
      }}
    >
      {label}
    </button>
  );

  return (
    <AppLayout topbarSearch={<div />}>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "14px 18px 13px" : "36px 40px 34px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 12 : 0 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FlaskConical size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, letterSpacing: "-0.03em" }}>
                  Research
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Discover faculty publications, papers &amp; datasets
              </p>
            </div>

            <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexShrink: 0, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              {canUpload && (
                <Link
                  href="/research/upload"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 7,
                    padding: isMobile ? "7px 11px" : "9px 16px", borderRadius: isMobile ? 7 : 9,
                    background: "var(--avatar-theme-color, #1a1a2e)", border: "none",
                    fontSize: isMobile ? 12 : 13, fontWeight: 600, color: "#fff", textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "opacity 0.2s",
                    flex: isMobile ? "1 1 100%" : "0 0 auto", justifyContent: "center",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <Plus size={isMobile ? 12 : 14} /> Upload
                </Link>
              )}
            </div>
          </div>

          {/* Integrated search */}
          <div style={{
            display: "flex", alignItems: "center", background: "#fff",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1.5px solid #dde2ff",
          }}>
            <Search size={16} color="#9ca3af" style={{ marginLeft: 16, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by title, author, or keyword…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: "13px 12px", color: "#1f2937", background: "transparent" }}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", color: "#9ca3af", display: "flex" }}>
                <X size={15} />
              </button>
            )}
            <button
              onClick={handleSearch}
              style={{
                margin: 5, padding: "9px 20px", background: "var(--avatar-theme-color, #1a1a2e)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "18px 16px" : "24px 40px" }}>

          {/* Type filter pills */}
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: "14px 16px", marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginBottom: isMobile ? 4 : 0 }}>
                Type
              </span>
              <div style={{ display: "flex", gap: 6, overflowX: isMobile ? "auto" : "visible", width: "100%", paddingBottom: isMobile ? 6 : 0, WebkitOverflowScrolling: "touch", flexWrap: isMobile ? "nowrap" : "wrap" }} className="scrollbar-none">
                {TYPE_FILTERS.map(t => (
                  <Pill
                    key={t.value}
                    label={t.label}
                    active={params.output_type === t.value}
                    onClick={() => setParams(p => ({ ...p, output_type: t.value, page: 1 }))}
                  />
                ))}
              </div>
              {(params.output_type || params.q) && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setParams({ q: "", output_type: "", page: 1, limit: 20 }); }}
                  style={{
                    marginLeft: isMobile ? "0" : "auto", marginTop: isMobile ? 12 : 0, display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20,
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    width: isMobile ? "100%" : "auto", justifyContent: "center"
                  }}
                >
                  <X size={11} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          {!isLoading && data && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <FileText size={13} color="#9ca3af" />
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>{data.total}</strong>{" "}
                output{data.total !== 1 ? "s" : ""} found
                {params.q && <span style={{ color: "#9ca3af" }}> for &ldquo;{params.q}&rdquo;</span>}
              </span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ padding: "16px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#991b1b", fontSize: 13 }}>
              Failed to load research outputs. Please try again.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FlaskConical size={26} color="#9ca3af" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>No outputs found</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Try different search terms or clear the type filter.</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && data?.items && data.items.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {data.items.map((item: any) => (
                  <ResearchCard key={item.output_id} item={item} onView={id => router.push(`/research/${id}`)} />
                ))}
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 16 }}>
                  <button
                    onClick={() => setParams(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={params.page === 1}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: params.page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: params.page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} color="#6b7280" />
                  </button>
                  <span style={{ fontSize: 13, color: "#6b7280", padding: "0 8px" }}>
                    Page {params.page} of {data.total_pages}
                  </span>
                  <button
                    onClick={() => setParams(p => ({ ...p, page: Math.min(data.total_pages, p.page + 1) }))}
                    disabled={params.page === data.total_pages}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: params.page === data.total_pages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: params.page === data.total_pages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} color="#6b7280" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
