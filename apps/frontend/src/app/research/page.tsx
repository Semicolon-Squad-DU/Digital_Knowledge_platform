"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Search, ExternalLink, Calendar, Plus } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const OUTPUT_TYPES = [
  { value: "", label: "All Types" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis", label: "Thesis" },
  { value: "dataset", label: "Dataset" },
  { value: "report", label: "Report" },
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  journal: { label: "Journal", className: "bg-violet-50 text-violet-700 border-violet-200" },
  conference: { label: "Conference", className: "bg-blue-50 text-blue-700 border-blue-200" },
  thesis: { label: "Thesis", className: "bg-amber-50 text-amber-700 border-amber-200" },
  dataset: { label: "Dataset", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  report: { label: "Report", className: "bg-slate-100 text-slate-700 border-slate-200" },
};


export default function ResearchPage() {
  const [params, setParams] = useState({ q: "", output_type: "", page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");
  const { user, isAuthenticated } = useAuthStore();
  const canUpload = isAuthenticated && ["researcher", "admin"].includes(user?.role ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["research", params],
    queryFn: async () => {
      const { data } = await api.get("/research", { params });
      return data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, q: searchInput, page: 1 }));
  };

  return (
    <div className="page-container py-8">
      <PageHeader
        title="Research Repository"
        subtitle="Discover faculty research, publications, and datasets"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Research" }]}
        actions={canUpload ? (
          <Link href="/research/upload">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Upload Research
            </Button>
          </Link>
        ) : undefined}
      />

      {/* Search + type filter */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="search-bar flex-1">
          <Search className="search-bar-icon" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, or keyword…"
            className="form-input pl-10"
            aria-label="Search research outputs"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Filter by output type">
        {OUTPUT_TYPES.map((t) => {
          const active = params.output_type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setParams((p) => ({ ...p, output_type: t.value, page: 1 }))}
              className={cn("filter-chip", active && "filter-chip-active")}
              aria-pressed={active}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="mb-4 min-h-[1.5rem]">
        {!isLoading && data && (
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{data.total}</span> outputs
          </p>
        )}
        {isLoading && <p className="text-sm text-slate-400">Searching…</p>}
      </div>

      {isError && <div className="alert alert-danger mb-4" role="alert">Failed to load research outputs.</div>}

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && !isError && data?.items?.length === 0 && (
        <EmptyState
          icon={<FlaskConical size={26} />}
          title="No research outputs found"
          description="Try different search terms or clear the type filter."
        />
      )}

      {!isLoading && data?.items && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((output: {
              output_id: string;
              title: string;
              abstract: string;
              authors: Array<{ name: string }>;
              keywords: string[];
              output_type: string;
              published_date: string;
              journal_name: string;
              doi: string;
              dkp_identifier: string;
              lab_name: string;
            }) => {
              const typeMeta = TYPE_BADGE[output.output_type] ?? { label: output.output_type, className: "bg-slate-100 text-slate-600 border-slate-200" };
              return (
                <div
                  key={output.output_id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-slate-300/80 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${typeMeta.className}`}>
                          {typeMeta.label}
                        </span>
                        {output.published_date && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={11} />
                            {formatDate(output.published_date)}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/research/${output.output_id}`}
                        className="font-semibold text-slate-900 hover:text-primary-700 transition-colors leading-snug block mt-1"
                      >
                        {output.title}
                      </Link>

                      <p className="text-sm text-slate-500 mt-1">
                        {output.authors?.map((a) => a.name).join(", ")}
                      </p>

                      {output.abstract && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {output.abstract}
                        </p>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2 text-right">
                      {output.doi && (
                        <a
                          href={`https://doi.org/${output.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={11} /> DOI
                        </a>
                      )}
                      {output.journal_name && (
                        <p className="text-xs text-slate-400 max-w-[140px] text-right line-clamp-2">
                          {output.journal_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span className="font-mono">{output.dkp_identifier}</span>
                    {output.lab_name && (
                      <>
                        <span>·</span>
                        <span>{output.lab_name}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Pagination
              page={params.page}
              totalPages={data.total_pages}
              total={data.total}
              limit={params.limit}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
