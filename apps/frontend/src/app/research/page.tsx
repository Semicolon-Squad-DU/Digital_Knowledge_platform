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
import { formatDate } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "journal",    label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis",     label: "Thesis" },
  { value: "dataset",    label: "Dataset" },
  { value: "report",     label: "Report" },
];

const PILL: Record<string, { bg: string; color: string }> = {
  published:  { bg: "#e6f4ea", color: "#1e7e34" },
  journal:    { bg: "#e8f0fe", color: "#1a56db" },
  conference: { bg: "#e8f0fe", color: "#1a56db" },
  thesis:     { bg: "#f3f4f6", color: "#6b7280" },
  dataset:    { bg: "#e6f4ea", color: "#1e7e34" },
  report:     { bg: "#f3f4f6", color: "#6b7280" },
};

function ResearchCard({ item, onView }: {
  item: {
    output_id: string; title: string; abstract?: string;
    authors?: Array<{ name: string }>; output_type: string;
    published_date: string; journal_name?: string; doi?: string;
    dkp_identifier: string;
  };
  onView: (id: string) => void;
}) {
  const typePill = PILL[item.output_type] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <div
      onClick={() => onView(item.output_id)}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 18, cursor: "pointer", transition: "all 0.18s",
        display: "flex", gap: 14,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#d1d5db"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: typePill.bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <FlaskConical size={20} color={typePill.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            padding: "2px 8px", borderRadius: 4, background: typePill.bg, color: typePill.color,
          }}>
            {item.output_type}
          </span>
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
            display: "flex", alignItems: "center", gap: 4, fontSize: 12,
            color: "#1a56db", textDecoration: "none", fontWeight: 600, flexShrink: 0, alignSelf: "flex-start",
          }}
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
  const canUpload = isAuthenticated && ["researcher", "admin"].includes(user?.role ?? "");

  const handleSearch = () => setParams(p => ({ ...p, q: searchInput, page: 1 }));
  const clearSearch  = () => { setSearchInput(""); setParams(p => ({ ...p, q: "", page: 1 })); };

  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button" onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 12.5,
        fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
        border: active ? "1.5px solid color-mix(in srgb, var(--avatar-theme-color, #6366f1) 35%, transparent)" : "1px solid #e5e7eb",
        background: active ? "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)" : "#fff",
        color: active ? "var(--avatar-theme-color, #4f46e5)" : "#6b7280",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#374151"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; } }}
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
                  <FlaskConical size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.03em" }}>
                  Research
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Discover faculty publications, papers &amp; datasets
              </p>
            </div>

            {canUpload && (
              <Link
                href="/research/upload"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 9,
                  background: "var(--avatar-theme-color, #1a1a2e)", border: "none",
                  fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "opacity 0.2s", flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} /> Upload
              </Link>
            )}
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
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "13px 12px", color: "#1f2937", background: "transparent" }}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                Type
              </span>
              {TYPE_FILTERS.map(t => (
                <Pill
                  key={t.value}
                  label={t.label}
                  active={params.output_type === t.value}
                  onClick={() => setParams(p => ({ ...p, output_type: t.value, page: 1 }))}
                />
              ))}
              {(params.output_type || params.q) && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setParams({ q: "", output_type: "", page: 1, limit: 20 }); }}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20,
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
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
