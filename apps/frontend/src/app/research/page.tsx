"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Search, ExternalLink, Calendar, Tag } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn, formatDate } from "@/lib/utils";

const OUTPUT_TYPES = [
  { value: "",                  label: "All Types" },
  { value: "journal_article",   label: "Journal" },
  { value: "conference_paper",  label: "Conference" },
  { value: "thesis",            label: "Thesis" },
  { value: "dataset",           label: "Dataset" },
  { value: "technical_report",  label: "Report" },
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  journal_article:  { label: "Journal",    className: "bg-primary/15 text-primary border-primary/30" },
  conference_paper: { label: "Conference", className: "bg-tertiary/15 text-tertiary border-tertiary/30" },
  thesis:           { label: "Thesis",     className: "bg-primary-container/40 text-primary-fixed border-primary/25" },
  dataset:          { label: "Dataset",    className: "bg-tertiary-container/30 text-tertiary-fixed border-tertiary/30" },
  technical_report: { label: "Report",     className: "bg-surface-container-high text-on-surface-variant border-outline-variant" },
};

export default function ResearchPage() {
  const [params, setParams] = useState({ q: "", output_type: "", page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");

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
    <div className="bg-background min-h-full">
    <div className="page-container py-8">
      <PageHeader
        title="Research"
        subtitle="Discover faculty research, publications, and datasets"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Research" }]}
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
        <Button type="submit" className="bg-primary text-on-primary border-primary hover:opacity-90">Search</Button>
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
          <p className="text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">{data.total.toLocaleString()}</span> outputs
          </p>
        )}
        {isLoading && <p className="text-sm text-on-surface-variant">Searching…</p>}
      </div>

      {isError && (
        <div className="rounded-lg border border-error/40 bg-error-container/20 text-error px-4 py-3 mb-4 text-sm" role="alert">
          Failed to load research outputs.
        </div>
      )}

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
              const typeMeta = TYPE_BADGE[output.output_type] ?? {
                label: output.output_type,
                className: "bg-surface-container-high text-on-surface-variant border-outline-variant",
              };
              return (
                <div
                  key={output.output_id}
                  className="bg-surface-container border border-outline-variant rounded-xl p-5 hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${typeMeta.className}`}>
                          {typeMeta.label}
                        </span>
                        {output.published_date && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Calendar size={11} />
                            {formatDate(output.published_date)}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/research/${output.output_id}`}
                        className="font-semibold text-on-surface hover:text-primary transition-colors leading-snug block mt-1"
                      >
                        {output.title}
                      </Link>

                      <p className="text-sm text-on-surface-variant mt-1">
                        {output.authors?.map((a) => a.name).join(", ")}
                      </p>

                      {output.abstract && (
                        <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                          {output.abstract}
                        </p>
                      )}

                      {/* Keywords */}
                      {output.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <Tag size={11} className="text-on-surface-variant mt-0.5 flex-shrink-0" />
                          {output.keywords.slice(0, 5).map((kw) => (
                            <span key={kw} className="text-xs text-on-surface-variant bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded-md">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2 text-right">
                      {output.doi && (
                        <a
                          href={`https://doi.org/${output.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-fixed font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={11} /> DOI
                        </a>
                      )}
                      {output.journal_name && (
                        <p className="text-xs text-on-surface-variant max-w-[140px] text-right line-clamp-2">
                          {output.journal_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant text-xs text-on-surface-variant">
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
    </div>
  );
}
