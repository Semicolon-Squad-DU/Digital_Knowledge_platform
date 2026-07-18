"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search, BookOpen, ChevronLeft, ChevronRight, Plus, Heart,
  FlaskConical, Building2, ArrowUpRight, ExternalLink,
} from "lucide-react";
import { useCatalogSearch, useDeleteCatalogItem, useAddToWishlist } from "@/features/library/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS } from "@/components/design/dkpTheme";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { type CatalogItem } from "./ResultCard";

const TRENDING = ["Bangladesh History", "Quantum Mechanics", "Economic Policy"];

/** Faculty tiles map to real catalog categories present in the seed/DB. */
const FACULTIES = [
  {
    key: "arts",
    title: "Arts & Humanities",
    desc: "Literature, History, Philosophy, and Linguistics.",
    category: "Novel",
    span: "large" as const,
    image: "/library-arts.png",
  },
  {
    key: "science",
    title: "Science",
    desc: "Physics, Chemistry, Math",
    category: "Textbook",
    span: "small" as const,
    icon: FlaskConical,
  },
  {
    key: "social",
    title: "Social Sciences",
    desc: "Economics, Sociology, Politics",
    category: "Reference",
    span: "small" as const,
    icon: Building2,
  },
  {
    key: "business",
    title: "Business Studies",
    desc: "Management, Accounting, Finance, and Marketing resources.",
    category: "Journal",
    span: "wide" as const,
    image: "/library-business.png",
  },
];

function statusFor(item: CatalogItem): { label: string; tone: "ok" | "muted" | "accent" } {
  if ((item.available_copies ?? 0) <= 0) return { label: "Borrowed", tone: "muted" };
  if (String(item.category || "").toLowerCase().includes("journal") || String(item.category || "").toLowerCase().includes("e-book")) {
    return { label: "E-Book", tone: "accent" };
  }
  return { label: "In Library", tone: "ok" };
}

function ArrivalCard({
  item,
  isAuthenticated,
  isLibrarian,
  onWishlist,
  onDelete,
}: {
  item: CatalogItem;
  isAuthenticated: boolean;
  isLibrarian: boolean;
  onWishlist: () => void;
  onDelete?: () => void;
}) {
  const status = statusFor(item);
  const authors = (item.authors || []).join(", ") || "Unknown author";
  const tone =
    status.tone === "ok" ? { dot: "#0D47A1", bg: "#e1e8fd", color: C.accent }
      : status.tone === "accent" ? { dot: "#0D47A1", bg: "#e1e8fd", color: C.accent }
        : { dot: "#9ca3af", bg: "#f3f4f6", color: "#6b7280" };

  return (
    <article
      className="dkp-coll-card"
      style={{
        minWidth: 240, maxWidth: 280, width: "100%", flex: "0 0 auto",
        background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12,
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 4px 16px rgba(26,26,46,0.05)",
      }}
    >
      <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div style={{ position: "relative", height: 160, background: `linear-gradient(145deg, ${C.band} 0%, ${C.chip} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BookOpen size={40} color={C.accent} style={{ opacity: 0.45 }} />
          <span style={{
            position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
            background: tone.bg, color: tone.color,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot }} />
            {status.label}
          </span>
        </div>
        <div style={{ padding: "16px 16px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.accent, marginBottom: 6 }}>
            {item.category || "General"}
          </div>
          <h3 style={{
            fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 6px", lineHeight: 1.3,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>
            {item.title}
          </h3>
          <p style={{ fontSize: 13, color: C.body, margin: 0, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {authors}
          </p>
        </div>
      </Link>
      <div style={{
        marginTop: "auto", padding: "12px 16px", borderTop: `1px solid ${C.line}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <Link
          href={`/library/${item.catalog_id}`}
          style={{ fontSize: 12, fontWeight: 700, color: C.body, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          {status.label === "E-Book" ? "Online Access" : "View details"} <ExternalLink size={12} />
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={() => {
              if (!isAuthenticated) { toast.error("Sign in to add to wishlist"); return; }
              onWishlist();
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.body, padding: 4, display: "inline-flex" }}
          >
            <Heart size={16} />
          </button>
          {isLibrarian && onDelete && (
            <button
              type="button"
              aria-label="Remove book"
              onClick={onDelete}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.body, padding: 4, fontSize: 12, fontWeight: 700 }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const isLibrarian = isAuthenticated && user?.role === "librarian";

  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState({
    query: "", category: "", page: 1, limit: 12,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const railRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useCatalogSearch({
    ...params,
    availability: "all" as const,
  });
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();
  const { mutateAsync: addToWishlist } = useAddToWishlist();

  const { data: facultyCounts } = useQuery({
    queryKey: ["library-faculty-counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        FACULTIES.map(async (f) => {
          const { data: res } = await api.get("/library/catalog/search", {
            params: { category: f.category, limit: 1 },
          });
          return [f.key, res.data?.total ?? 0] as const;
        })
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
    staleTime: 60_000,
  });

  if (!hasHydrated) return null;

  const handleSearch = (e?: React.FormEvent, q?: string) => {
    e?.preventDefault();
    const query = (q ?? searchInput).trim();
    setSearchInput(query);
    setParams((p) => ({ ...p, query, category: "", page: 1 }));
  };

  const selectFaculty = (f: (typeof FACULTIES)[number]) => {
    setSearchInput("");
    setParams({
      query: "",
      category: f.category,
      page: 1,
      limit: 12,
    });
    document.getElementById("dkp-library-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBook(deleteId);
      toast.success("Removed");
      setDeleteId(null);
      refetch();
    } catch {
      toast.error("Failed to remove");
    }
  };

  const scrollRail = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  const total = data?.total ?? 0;
  const items = (data?.items ?? []) as CatalogItem[];
  const hasActiveFilter = Boolean(params.query || params.category);
  const resultsTitle = hasActiveFilter ? "Catalog Results" : "New Arrivals";

  return (
    <CollectionShell active="Library">
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-lib-faculties { grid-template-columns: 1fr 1fr !important; grid-auto-rows: 140px !important; }
          .dkp-lib-fac-large, .dkp-lib-fac-wide { grid-column: span 2 !important; grid-row: span 1 !important; }
        }
        @media (max-width: 560px) {
          .dkp-lib-faculties { grid-template-columns: 1fr !important; }
          .dkp-lib-fac-large, .dkp-lib-fac-wide { grid-column: span 1 !important; }
        }
        .dkp-lib-rail { scrollbar-width: none; }
        .dkp-lib-rail::-webkit-scrollbar { display: none; }
        .dkp-lib-trend:hover { background: ${C.band} !important; border-color: ${C.accent} !important; }
      `}} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(40px, 6vw, 72px) clamp(16px, 4vw, 64px) 72px" }}>
        {/* Hero */}
        <header style={{ textAlign: "center", maxWidth: 820, margin: "0 auto 56px", position: "relative" }}>
          {isLibrarian && (
            <button
              type="button"
              onClick={() => router.push("/librarian/book/add")}
              style={{
                position: "absolute", top: 0, right: 0, display: "inline-flex", alignItems: "center", gap: 6,
                background: C.ink, color: C.white, border: "none", borderRadius: 6,
                padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add Book
            </button>
          )}
          <h1 style={{
            fontFamily: SERIF, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, color: C.ink,
            margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            Explore the Library Catalog
          </h1>
          <p style={{ fontSize: 17, color: C.body, margin: "0 0 28px", lineHeight: 1.6 }}>
            Access millions of books, journals, and special collections housed within the University of Dhaka.
          </p>

          <form
            onSubmit={(e) => handleSearch(e)}
            style={{
              display: "flex", alignItems: "center", gap: 0, background: C.white,
              border: `1.5px solid ${C.lineStrong}`, borderRadius: 10, overflow: "hidden",
              boxShadow: "0 4px 24px rgba(26,26,46,0.06)", maxWidth: 640, margin: "0 auto",
            }}
          >
            <Search size={18} color={C.body} style={{ marginLeft: 16, flexShrink: 0 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, author, keyword, or ISBN..."
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 15, padding: "14px 12px",
                color: C.ink, background: "transparent", fontFamily: SANS,
              }}
            />
            <button
              type="submit"
              style={{
                margin: 6, padding: "10px 22px", background: C.accent, color: C.white, border: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 18 }}>
            <span style={{ fontSize: 13, color: C.body, fontWeight: 600 }}>Trending:</span>
            {TRENDING.map((t) => (
              <button
                key={t}
                type="button"
                className="dkp-lib-trend"
                onClick={() => handleSearch(undefined, t)}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: `1px solid ${C.lineStrong}`,
                  background: C.chip, color: C.ink, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "background .15s, border-color .15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* Browse by Faculty */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.ink, margin: 0 }}>Browse by Faculty</h2>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setParams({ query: "", category: "", page: 1, limit: 12 });
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none",
                color: C.accent, fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              View All <ArrowUpRight size={16} />
            </button>
          </div>

          <div
            className="dkp-lib-faculties"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "150px",
              gap: 16,
            }}
          >
            {FACULTIES.map((f) => {
              const count = facultyCounts?.[f.key];
              const selected = params.category === f.category;
              if (f.span === "large") {
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="dkp-lib-fac-large dkp-coll-card"
                    onClick={() => selectFaculty(f)}
                    style={{
                      gridColumn: "span 2", gridRow: "span 2", position: "relative", borderRadius: 12,
                      overflow: "hidden", border: selected ? `2px solid ${C.accent}` : `1px solid ${C.lineStrong}`,
                      cursor: "pointer", padding: 0, textAlign: "left",
                    }}
                  >
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url(${f.image})`, backgroundSize: "cover", backgroundPosition: "center",
                    }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,46,0.92) 0%, rgba(26,26,46,0.35) 55%, transparent 100%)" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24 }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.white, margin: "0 0 8px" }}>{f.title}</h3>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 14px", lineHeight: 1.45 }}>{f.desc}</p>
                      <span style={{
                        display: "inline-block", padding: "5px 10px", borderRadius: 6,
                        background: "rgba(255,255,255,0.18)", color: C.white, fontSize: 12, fontWeight: 700,
                      }}>
                        {(count ?? 0).toLocaleString()} Items
                      </span>
                    </div>
                  </button>
                );
              }
              if (f.span === "wide") {
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="dkp-lib-fac-wide dkp-coll-card"
                    onClick={() => selectFaculty(f)}
                    style={{
                      gridColumn: "span 2", position: "relative", borderRadius: 12, overflow: "hidden",
                      border: selected ? `2px solid ${C.accent}` : `1px solid ${C.lineStrong}`,
                      cursor: "pointer", padding: 0, textAlign: "left",
                    }}
                  >
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url(${f.image})`, backgroundSize: "cover", backgroundPosition: "center",
                      filter: "brightness(0.55)",
                    }} />
                    <div style={{ position: "relative", zIndex: 1, padding: 22, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.white, margin: "0 0 6px" }}>{f.title}</h3>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
                    </div>
                  </button>
                );
              }
              const Icon = f.icon!;
              return (
                <button
                  key={f.key}
                  type="button"
                  className="dkp-coll-card"
                  onClick={() => selectFaculty(f)}
                  style={{
                    background: C.white, border: selected ? `2px solid ${C.accent}` : `1px solid ${C.lineStrong}`,
                    borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, background: C.chip, color: C.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} />
                    </div>
                    <ArrowUpRight size={16} color={C.body} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: C.body, margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* New Arrivals / Results */}
        <section id="dkp-library-results">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.ink, margin: 0 }}>{resultsTitle}</h2>
              <p style={{ fontSize: 14, color: C.body, margin: "6px 0 0" }}>
                {isLoading ? "Loading…" : `${total.toLocaleString()} titles`}
                {params.query ? ` for “${params.query}”` : ""}
                {params.category ? ` · ${params.category}` : ""}
              </p>
            </div>
            {!hasActiveFilter && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  aria-label="Scroll left"
                  onClick={() => scrollRail(-1)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.lineStrong}`,
                    background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => scrollRail(1)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.lineStrong}`,
                    background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {isError && (
            <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
              Failed to load catalog. Please try again.
            </div>
          )}

          {isLoading && (
            <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-60 rounded-xl flex-shrink-0" />
              ))}
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 24px", background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12 }}>
              <BookOpen size={28} color={C.body} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>No books found</p>
              <p style={{ fontSize: 14, color: C.body, margin: 0 }}>Try a different search or browse by faculty.</p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div
              ref={railRef}
              className="dkp-lib-rail"
              style={{
                display: "flex", gap: 16, overflowX: hasActiveFilter ? "visible" : "auto",
                flexWrap: hasActiveFilter ? "wrap" : "nowrap", paddingBottom: 8,
              }}
            >
              {items.map((item) => (
                <ArrivalCard
                  key={item.catalog_id}
                  item={item}
                  isAuthenticated={isAuthenticated}
                  isLibrarian={!!isLibrarian}
                  onWishlist={async () => {
                    try {
                      await addToWishlist(item.catalog_id);
                      toast.success("Added to wishlist");
                    } catch {
                      toast.error("Already in wishlist");
                    }
                  }}
                  onDelete={isLibrarian ? () => { setDeleteId(item.catalog_id); setDeleteTitle(item.title); } : undefined}
                />
              ))}
            </div>
          )}

          {!isLoading && (data?.total_pages ?? 1) > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 28 }}>
              <button
                type="button"
                disabled={params.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                style={{
                  width: 40, height: 40, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.white,
                  cursor: params.page <= 1 ? "not-allowed" : "pointer", opacity: params.page <= 1 ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 14, color: C.body, fontWeight: 600 }}>
                Page {params.page} of {data?.total_pages}
              </span>
              <button
                type="button"
                disabled={params.page >= (data?.total_pages ?? 1)}
                onClick={() => setParams((p) => ({ ...p, page: Math.min(data?.total_pages ?? 1, p.page + 1) }))}
                style={{
                  width: 40, height: 40, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.white,
                  cursor: params.page >= (data?.total_pages ?? 1) ? "not-allowed" : "pointer",
                  opacity: params.page >= (data?.total_pages ?? 1) ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Book"
        description={`Remove "${deleteTitle}" from the catalog?`}
        confirmLabel="Remove"
        loading={isDeleting}
        variant="danger"
      />
    </CollectionShell>
  );
}
