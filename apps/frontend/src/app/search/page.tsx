"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useArchiveSearch } from "@/hooks/useArchive";
import { useCatalogSearch } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/Button";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const archive = useArchiveSearch({ query: submittedQuery, page: 1, limit: 5 });
  const library = useCatalogSearch({ query: submittedQuery, page: 1, limit: 5, availability: "all" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Global Search</h1>
        <p className="text-slate-600 mt-1">Search across archive documents and library catalog</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type keywords and search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {!submittedQuery && (
        <p className="text-sm text-slate-500">Enter a keyword to see results.</p>
      )}

      {submittedQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Archive</h2>
              <Link href="/archive" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {archive.isLoading ? (
              <p className="text-sm text-slate-500">Searching archive...</p>
            ) : archive.data?.items?.length ? (
              <ul className="space-y-2">
                {archive.data.items.map((item: { item_id: string; title_en: string }) => (
                  <li key={item.item_id}>
                    <Link href={`/archive/${item.item_id}`} className="text-sm text-slate-700 hover:text-primary-700 hover:underline">
                      {item.title_en}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No archive matches.</p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Library</h2>
              <Link href="/library" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {library.isLoading ? (
              <p className="text-sm text-slate-500">Searching library...</p>
            ) : library.data?.items?.length ? (
              <ul className="space-y-2">
                {library.data.items.map((item: { catalog_id: string; title: string }) => (
                  <li key={item.catalog_id}>
                    <Link href={`/library/${item.catalog_id}`} className="text-sm text-slate-700 hover:text-primary-700 hover:underline">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No library matches.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}