"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Archive, BookOpen, FlaskConical, GraduationCap } from "lucide-react";
import { useArchiveSearch } from "@/hooks/useArchive";
import { useCatalogSearch } from "@/hooks/useLibrary";

function SearchResults({ q }: { q: string }) {
  const archive = useArchiveSearch({ query: q, page: 1, limit: 8 });
  const library = useCatalogSearch({ query: q, page: 1, limit: 8, availability: "all" });

  const archiveItems = archive.data?.items ?? [];
  const libraryItems = library.data?.items ?? [];
  const totalResults = archiveItems.length + libraryItems.length;

  return (
    <div>
      <p className="text-sm mb-6" style={{ color: "var(--color-fg-muted)" }}>
        {archive.isLoading || library.isLoading
          ? "Searching…"
          : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${q}"`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive results */}
        <section
          className="gh-box overflow-hidden"
          aria-label="Archive search results"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ background: "var(--color-canvas-subtle)", borderColor: "var(--color-border-default)" }}
          >
            <div className="flex items-center gap-2">
              <Archive size={14} style={{ color: "var(--color-fg-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>Archive</span>
              {!archive.isLoading && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--color-neutral-muted)", color: "var(--color-fg-muted)" }}
                >
                  {archiveItems.length}
                </span>
              )}
            </div>
            <Link
              href={`/archive?q=${encodeURIComponent(q)}`}
              className="text-xs"
              style={{ color: "var(--color-accent-fg)" }}
            >
              View all →
            </Link>
          </div>
          <div className="p-3">
            {archive.isLoading ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-fg-muted)" }}>Searching archive…</p>
            ) : archiveItems.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-fg-muted)" }}>No archive matches.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--color-border-muted)" }}>
                {archiveItems.map((item: { item_id: string; title_en: string; category?: string }) => (
                  <li key={item.item_id}>
                    <Link
                      href={`/archive/${item.item_id}`}
                      className="flex items-start gap-2 py-2 px-1 rounded-md text-sm hover:bg-[var(--color-canvas-subtle)] transition-colors"
                      style={{ color: "var(--color-fg-default)" }}
                    >
                      <Archive size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-fg-muted)" }} />
                      <span className="line-clamp-1">{item.title_en}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Library results */}
        <section
          className="gh-box overflow-hidden"
          aria-label="Library search results"
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ background: "var(--color-canvas-subtle)", borderColor: "var(--color-border-default)" }}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: "var(--color-fg-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>Library</span>
              {!library.isLoading && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--color-neutral-muted)", color: "var(--color-fg-muted)" }}
                >
                  {libraryItems.length}
                </span>
              )}
            </div>
            <Link
              href={`/library?q=${encodeURIComponent(q)}`}
              className="text-xs"
              style={{ color: "var(--color-accent-fg)" }}
            >
              View all →
            </Link>
          </div>
          <div className="p-3">
            {library.isLoading ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-fg-muted)" }}>Searching library…</p>
            ) : libraryItems.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-fg-muted)" }}>No library matches.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--color-border-muted)" }}>
                {libraryItems.map((item: { catalog_id: string; title: string; authors?: string[] }) => (
                  <li key={item.catalog_id}>
                    <Link
                      href={`/library/${item.catalog_id}`}
                      className="flex items-start gap-2 py-2 px-1 rounded-md text-sm hover:bg-[var(--color-canvas-subtle)] transition-colors"
                      style={{ color: "var(--color-fg-default)" }}
                    >
                      <BookOpen size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-fg-muted)" }} />
                      <span className="line-clamp-1">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Quick links to search in specific sections */}
      <div className="mt-6 gh-box p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-fg-muted)" }}>SEARCH IN SPECIFIC SECTION</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: `/archive?q=${encodeURIComponent(q)}`,  icon: Archive,       label: "Archive" },
            { href: `/library?q=${encodeURIComponent(q)}`,  icon: BookOpen,      label: "Library" },
            { href: `/research?q=${encodeURIComponent(q)}`, icon: FlaskConical,  label: "Research" },
            { href: `/showcase?q=${encodeURIComponent(q)}`, icon: GraduationCap, label: "Showcase" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors hover:bg-[var(--color-canvas-subtle)]"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-fg-default)" }}
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

  // Sync input when URL param changes
  useEffect(() => {
    setInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-fg-default)" }}>Search</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-fg-muted)" }}>
          Search across archive, library, research, and showcase
        </p>
      </div>

      {/* Search bar — only one, synced with URL */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={15}
            style={{ color: "var(--color-fg-muted)" }}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search documents, books, research…"
            className="w-full pl-9 pr-4 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-emphasis)]"
            style={{
              background: "var(--color-canvas-default)",
              borderColor: "var(--color-border-default)",
              color: "var(--color-fg-default)",
            }}
            aria-label="Search"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
          style={{ background: "var(--color-accent-emphasis)" }}
        >
          Search
        </button>
      </form>

      {initialQ ? (
        <SearchResults q={initialQ} />
      ) : (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto mb-3" style={{ color: "var(--color-fg-subtle)" }} />
          <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
            Type something above or use <kbd className="px-1.5 py-0.5 rounded border text-xs font-mono" style={{ borderColor: "var(--color-border-default)" }}>⌘K</kbd> from anywhere
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
