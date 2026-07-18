"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Upload, FileText, FlaskConical, ExternalLink, Calendar,
  ChevronDown, Database, Users, Quote, TrendingUp, Filter,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, accessVisual } from "@/components/design/dkpTheme";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "", label: "All Types" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis", label: "Thesis" },
  { value: "dataset", label: "Dataset" },
  { value: "report", label: "Report" },
];

export default function ResearchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [params, setParams] = useState({ q: "", output_type: "", year: "", page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["research", params],
    queryFn: async () => {
      const { data } = await api.get("/research", {
        params: {
          q: params.q || undefined,
          output_type: params.output_type || undefined,
          year: params.year || undefined,
          page: params.page,
          limit: params.limit,
        },
      });
      return data.data;
    },
  });

  const canUpload = isAuthenticated && user?.role === "researcher";
  const total = data?.total ?? 0;
  const datasets = (data?.items ?? []).filter((i: any) => i.output_type === "dataset").length;

  const applyFilters = () => {
    const year = yearFrom && yearTo && yearFrom === yearTo
      ? yearFrom
      : yearFrom && !yearTo
        ? yearFrom
        : yearTo && !yearFrom
          ? yearTo
          : "";
    setParams((p) => ({ ...p, q: searchInput, year, page: 1 }));
  };

  const items = [...(data?.items ?? [])].sort((a: any, b: any) => {
    const da = new Date(a.published_date || a.created_at || 0).getTime();
    const db = new Date(b.published_date || b.created_at || 0).getTime();
    return sortNewest ? db - da : da - db;
  });

  const metrics = [
    { icon: FileText, label: "Total Publications", value: total.toLocaleString(), hint: "In this repository" },
    { icon: Quote, label: "Open Outputs", value: String(Math.max(total, 0)), hint: "Discoverable records" },
    { icon: Database, label: "Open Datasets", value: String(datasets || "—"), hint: "On this page" },
    { icon: Users, label: "Active Faculty", value: "—", hint: "Contributing researchers" },
  ];

  return (
    <CollectionShell active="Research">
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-res-hero { grid-template-columns: 1fr !important; }
          .dkp-res-hero-img { display: none !important; }
          .dkp-res-body { grid-template-columns: 1fr !important; }
          .dkp-res-metrics { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(36px, 5vw, 64px) clamp(16px, 4vw, 64px) 64px" }}>
        {/* Hero */}
        <header className="dkp-res-hero" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center", marginBottom: 56 }}>
          <div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 700, color: C.ink, margin: "0 0 18px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Research Repository
            </h1>
            <p style={{ fontSize: 18, color: C.body, margin: "0 0 28px", lineHeight: 1.6, maxWidth: 560 }}>
              Discover, access, and contribute to the university&apos;s growing collection of faculty publications, datasets, and high-impact research.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {canUpload ? (
                <Link
                  href="/research/upload"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: C.white,
                    padding: "12px 22px", borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "0.03em",
                  }}
                >
                  <Upload size={16} /> Submit Publication
                </Link>
              ) : (
                <Link
                  href={isAuthenticated ? "/research/upload" : "/login"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: C.white,
                    padding: "12px 22px", borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: "0.03em",
                  }}
                >
                  <Upload size={16} /> Submit Publication
                </Link>
              )}
              <Link
                href="/about"
                style={{
                  display: "inline-flex", alignItems: "center", border: `1.5px solid ${C.ink}`, color: C.ink,
                  padding: "11px 22px", borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none",
                }}
              >
                Browse Guidelines
              </Link>
            </div>
          </div>
          <div className="dkp-res-hero-img">
            <img
              src="/research-hero.png"
              alt="University research library interior"
              style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 12, boxShadow: "0 4px 24px rgba(26,26,46,0.1)", display: "block" }}
            />
          </div>
        </header>

        {/* Metrics */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.ink, margin: "0 0 20px", paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
            Impact Metrics
          </h2>
          <div className="dkp-res-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {metrics.map(({ icon: Icon, label, value, hint }) => (
              <div key={label} className="dkp-coll-card" style={{ background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12, padding: 22, boxShadow: "0 4px 12px rgba(26,26,46,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.body, marginBottom: 12 }}>
                  <Icon size={18} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.ink }}>{isLoading ? "…" : value}</div>
                <div style={{ fontSize: 13, color: "#15803d", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={14} /> {hint}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filters + list */}
        <div className="dkp-res-body" style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 28 }}>
          <aside style={{ background: C.sidebar, border: `1px solid ${C.lineStrong}`, borderRadius: 10, padding: 22, height: "fit-content", position: "sticky", top: 88 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.body, margin: "0 0 18px" }}>
              <Filter size={14} /> Filter Research
            </h2>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Search Term</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={14} color={C.body} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Title, author, keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 34px", border: `1px solid ${C.lineStrong}`, borderRadius: 6, fontSize: 14, outline: "none", background: C.white }}
              />
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Output Type</label>
            <select
              value={params.output_type}
              onChange={(e) => setParams((p) => ({ ...p, output_type: e.target.value, page: 1 }))}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.lineStrong}`, borderRadius: 6, fontSize: 14, marginBottom: 16, background: C.white, color: C.ink }}
            >
              {TYPE_FILTERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Publication Year</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input type="number" placeholder="From" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.lineStrong}`, borderRadius: 6, fontSize: 14, background: C.white }} />
              <input type="number" placeholder="To" value={yearTo} onChange={(e) => setYearTo(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.lineStrong}`, borderRadius: 6, fontSize: 14, background: C.white }} />
            </div>

            <button
              type="button"
              onClick={applyFilters}
              style={{ width: "100%", padding: "11px 14px", background: C.band, color: C.ink, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Apply Filters
            </button>
            {(params.q || params.output_type || params.year) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput(""); setYearFrom(""); setYearTo("");
                  setParams({ q: "", output_type: "", year: "", page: 1, limit: 10 });
                }}
                style={{ width: "100%", marginTop: 10, padding: "10px 14px", background: "transparent", color: C.body, border: `1px solid ${C.lineStrong}`, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Clear
              </button>
            )}
          </aside>

          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>Latest Publications</h2>
              <button
                type="button"
                onClick={() => setSortNewest((v) => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {sortNewest ? "Newest First" : "Oldest First"} <ChevronDown size={14} />
              </button>
            </div>

            {isLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            )}

            {isError && (
              <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
                Failed to load research outputs. Please try again.
              </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12 }}>
                <FlaskConical size={28} color={C.body} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>No outputs found</p>
                <p style={{ fontSize: 14, color: C.body, margin: 0 }}>Try different search terms or clear filters.</p>
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {items.map((item: any) => {
                  const tier = item.access_tier ? accessVisual(item.access_tier) : null;
                  return (
                    <article
                      key={item.output_id}
                      onClick={() => router.push(`/research/${item.output_id}`)}
                      className="dkp-coll-card"
                      style={{
                        background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12, padding: 22,
                        cursor: "pointer", boxShadow: "0 4px 12px rgba(26,26,46,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: C.chip, color: C.accent }}>
                          {item.output_type}
                        </span>
                        {tier && (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                            {tier.label}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.ink, margin: "0 0 8px", lineHeight: 1.3 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 14, color: C.body, margin: "0 0 10px" }}>
                        {(item.authors || []).map((a: any) => a.name).filter(Boolean).join(", ") || item.uploader_name || "Unknown author"}
                        {item.journal_name ? ` | ${item.journal_name}` : ""}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", fontSize: 13, color: C.body }}>
                        {item.published_date && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={13} /> {formatDate(item.published_date)}
                          </span>
                        )}
                        {item.doi && (
                          <a
                            href={`https://doi.org/${item.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.accent, fontWeight: 600, textDecoration: "none" }}
                          >
                            DOI <ExternalLink size={12} />
                          </a>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: C.ink, background: C.chip, padding: "6px 10px", borderRadius: 6 }}>
                          {item.output_type === "dataset" ? "Data" : "PDF"}
                        </span>
                      </div>
                    </article>
                  );
                })}

                {data?.total_pages > 1 && (
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, page: Math.min(data.total_pages, p.page + 1) }))}
                    disabled={params.page >= data.total_pages}
                    style={{
                      marginTop: 8, alignSelf: "center", background: "transparent", border: "none",
                      color: C.accent, fontSize: 14, fontWeight: 700, cursor: params.page >= data.total_pages ? "not-allowed" : "pointer",
                      opacity: params.page >= data.total_pages ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    Load More Publications <ChevronDown size={16} />
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </CollectionShell>
  );
}
