"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Archive, BookOpen, FlaskConical, GraduationCap } from "lucide-react";
import { useArchiveSearch } from "@/features/archive/hooks/useArchive";
import { useCatalogSearch } from "@/features/library/hooks/useLibrary";

function SearchResults({ q }: { q: string }) {
  const archive = useArchiveSearch({ query: q, page: 1, limit: 8 });
  const library = useCatalogSearch({ query: q, page: 1, limit: 8, availability: "all" });

  const archiveItems = archive.data?.items ?? [];
  const libraryItems = library.data?.items ?? [];
  const totalResults = archiveItems.length + libraryItems.length;

  return (
    <div>
      <p className="text-sm mb-6 text-on-surface-variant">
        {archive.isLoading || library.isLoading
          ? "Searching…"
          : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${q}"`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive results */}
        <section
          className="rounded-lg border border-outline-variant bg-surface-container overflow-hidden"
          aria-label="Archive search results"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-high">
            <div className="flex items-center gap-2">
              <Archive size={14} className="text-on-surface-variant" />
              <span className="text-sm font-semibold text-on-surface">Archive</span>
              {!archive.isLoading && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                  {archiveItems.length}
                </span>
              )}
            </div>
            <Link href={`/archive?q=${encodeURIComponent(q)}`} className="text-xs text-primary hover:text-primary-fixed">
              View all →
            </Link>
          </div>
          <div className="p-3">
            {archive.isLoading ? (
              <p className="text-sm py-4 text-center text-on-surface-variant">Searching archive…</p>
            ) : archiveItems.length === 0 ? (
              <p className="text-sm py-4 text-center text-on-surface-variant">No archive matches.</p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {archiveItems.map((item: { item_id: string; title_en: string; category?: string }) => (
                  <li key={item.item_id}>
                    <Link
                      href={`/archive/${item.item_id}`}
                      className="flex items-start gap-2 py-2 px-1 rounded-md text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <Archive size={13} className="mt-0.5 shrink-0 text-on-surface-variant" />
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
          className="rounded-lg border border-outline-variant bg-surface-container overflow-hidden"
          aria-label="Library search results"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-high">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-on-surface-variant" />
              <span className="text-sm font-semibold text-on-surface">Library</span>
              {!library.isLoading && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                  {libraryItems.length}
                </span>
              )}
            </div>
            <Link href={`/library?q=${encodeURIComponent(q)}`} className="text-xs text-primary hover:text-primary-fixed">
              View all →
            </Link>
          </div>
          <div className="p-3">
            {library.isLoading ? (
              <p className="text-sm py-4 text-center text-on-surface-variant">Searching library…</p>
            ) : libraryItems.length === 0 ? (
              <p className="text-sm py-4 text-center text-on-surface-variant">No library matches.</p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {libraryItems.map((item: { catalog_id: string; title: string; authors?: string[] }) => (
                  <li key={item.catalog_id}>
                    <Link
                      href={`/library/${item.catalog_id}`}
                      className="flex items-start gap-2 py-2 px-1 rounded-md text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <BookOpen size={13} className="mt-0.5 shrink-0 text-on-surface-variant" />
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
      <div className="mt-6 rounded-lg border border-outline-variant bg-surface-container p-4">
        <p className="text-xs font-semibold mb-3 text-on-surface-variant tracking-wide">SEARCH IN SPECIFIC SECTION</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: `/archive?q=${encodeURIComponent(q)}`, icon: Archive, label: "Archive" },
            { href: `/library?q=${encodeURIComponent(q)}`, icon: BookOpen, label: "Library" },
            { href: `/research?q=${encodeURIComponent(q)}`, icon: FlaskConical, label: "Research" },
            { href: `/showcase?q=${encodeURIComponent(q)}`, icon: GraduationCap, label: "Showcase" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high"
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
    <div className="min-h-screen bg-background">
      <div className="page-container py-8">
        <div className="mb-6">
          <h1 className="font-display text-xl font-medium text-on-surface tracking-tight">Search</h1>
          <p className="text-sm mt-1 text-on-surface-variant">Search across archive, library, research, and showcase</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={15} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search documents, books, research…"
              className="w-full pl-9 pr-4 py-2 rounded-md border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Search"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-on-primary transition-colors hover:opacity-90"
          >
            Search
          </button>
        </form>

        {initialQ ? (
          <SearchResults q={initialQ} />
        ) : (
          <div className="text-center py-16">
            <Search size={32} className="mx-auto mb-3 text-on-surface-variant/50" />
            <p className="text-sm text-on-surface-variant">
              Type something above or use{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-outline-variant text-xs font-mono bg-surface-container-high">
                ⌘K
              </kbd>{" "}
              from anywhere
            </p>
          </div>
        )}
      </div>
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
