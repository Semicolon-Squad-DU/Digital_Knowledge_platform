"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Archive, BookOpen, FlaskConical, GraduationCap } from "lucide-react";
import { useArchiveSearch } from "@/features/archive/hooks/useArchive";
import { useCatalogSearch } from "@/features/library/hooks/useLibrary";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, pagePad, cardStyle, btnPrimary, inputStyle, RADIUS } from "@/components/design/dkpTheme";

function SearchResults({ q }: { q: string }) {
  const archive = useArchiveSearch({ query: q, page: 1, limit: 8 });
  const library = useCatalogSearch({ query: q, page: 1, limit: 8, availability: "all" });

  const archiveItems = archive.data?.items ?? [];
  const libraryItems = library.data?.items ?? [];
  const totalResults = archiveItems.length + libraryItems.length;

  return (
    <div>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: "0 0 24px" }}>
        {archive.isLoading || library.isLoading
          ? "Searching…"
          : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${q}"`}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <section style={{ ...cardStyle, overflow: "hidden" }} aria-label="Archive search results">
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${C.lineStrong}`,
            background: C.surfaceHigh,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Archive size={14} color={C.body} />
              <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink }}>Archive</span>
              {!archive.isLoading && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: RADIUS.full,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: SANS,
                  background: C.chip,
                  color: C.body,
                  border: `1px solid ${C.outlineVariant}`,
                }}>
                  {archiveItems.length}
                </span>
              )}
            </div>
            <Link href={`/archive?q=${encodeURIComponent(q)}`} style={{ fontSize: 12, fontFamily: SANS, fontWeight: 600, color: C.accent, textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: 12 }}>
            {archive.isLoading ? (
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, textAlign: "center", padding: "16px 0", margin: 0 }}>Searching archive…</p>
            ) : archiveItems.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, textAlign: "center", padding: "16px 0", margin: 0 }}>No archive matches.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {archiveItems.map((item: { item_id: string; title_en: string; category?: string }, idx: number) => (
                  <li key={item.item_id} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                    <Link
                      href={`/archive/${item.item_id}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "10px 6px",
                        fontSize: 14,
                        fontFamily: SANS,
                        color: C.ink,
                        textDecoration: "none",
                        borderRadius: RADIUS.DEFAULT,
                      }}
                    >
                      <Archive size={13} color={C.body} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title_en}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section style={{ ...cardStyle, overflow: "hidden" }} aria-label="Library search results">
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${C.lineStrong}`,
            background: C.surfaceHigh,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={14} color={C.body} />
              <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink }}>Library</span>
              {!library.isLoading && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: RADIUS.full,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: SANS,
                  background: C.chip,
                  color: C.body,
                  border: `1px solid ${C.outlineVariant}`,
                }}>
                  {libraryItems.length}
                </span>
              )}
            </div>
            <Link href={`/library?q=${encodeURIComponent(q)}`} style={{ fontSize: 12, fontFamily: SANS, fontWeight: 600, color: C.accent, textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: 12 }}>
            {library.isLoading ? (
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, textAlign: "center", padding: "16px 0", margin: 0 }}>Searching library…</p>
            ) : libraryItems.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, textAlign: "center", padding: "16px 0", margin: 0 }}>No library matches.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {libraryItems.map((item: { catalog_id: string; title: string; authors?: string[] }, idx: number) => (
                  <li key={item.catalog_id} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                    <Link
                      href={`/library/${item.catalog_id}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "10px 6px",
                        fontSize: 14,
                        fontFamily: SANS,
                        color: C.ink,
                        textDecoration: "none",
                        borderRadius: RADIUS.DEFAULT,
                      }}
                    >
                      <BookOpen size={13} color={C.body} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div style={{ ...cardStyle, marginTop: 24, padding: 20 }}>
        <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.body, margin: "0 0 14px" }}>
          Search in specific section
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { href: `/archive?q=${encodeURIComponent(q)}`, icon: Archive, label: "Archive" },
            { href: `/library?q=${encodeURIComponent(q)}`, icon: BookOpen, label: "Library" },
            { href: `/research?q=${encodeURIComponent(q)}`, icon: FlaskConical, label: "Research" },
            { href: `/showcase?q=${encodeURIComponent(q)}`, icon: GraduationCap, label: "Showcase" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: RADIUS.DEFAULT,
                fontSize: 13,
                fontFamily: SANS,
                fontWeight: 600,
                color: C.ink,
                background: C.chip,
                border: `1px solid ${C.lineStrong}`,
                textDecoration: "none",
              }}
            >
              <link.icon size={13} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initialQ);

  useEffect(() => {
    setInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <CollectionShell>
      <div style={pagePad}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 700, color: C.ink, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Search
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: C.body, margin: 0 }}>
            Search across archive, library, research, and showcase
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search
              size={16}
              color={C.body}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search documents, books, research…"
              aria-label="Search"
              autoFocus
              style={{ ...inputStyle(), paddingLeft: 40 }}
            />
          </div>
          <button type="submit" style={{ ...btnPrimary, flexShrink: 0 }}>
            Search
          </button>
        </form>

        {initialQ ? (
          <SearchResults q={initialQ} />
        ) : (
          <div style={{ textAlign: "center", padding: "64px 16px" }}>
            <Search size={36} color={C.outlineVariant} style={{ margin: "0 auto 14px" }} />
            <p style={{ fontFamily: SANS, fontSize: 15, color: C.body, margin: 0 }}>
              Type something above or use{" "}
              <kbd style={{
                padding: "2px 8px",
                borderRadius: RADIUS.DEFAULT,
                border: `1px solid ${C.lineStrong}`,
                fontSize: 12,
                fontFamily: "ui-monospace, monospace",
                background: C.chip,
                color: C.ink,
              }}>
                ⌘K
              </kbd>{" "}
              from anywhere
            </p>
          </div>
        )}
      </div>
    </CollectionShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <CollectionShell>
          <div style={{ ...pagePad, color: C.body, fontFamily: SANS }}>Loading…</div>
        </CollectionShell>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
