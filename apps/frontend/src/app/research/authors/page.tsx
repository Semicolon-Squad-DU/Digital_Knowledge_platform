"use client";

import Link from "next/link";
import { Users, FileText, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResearchAuthors } from "@/features/research/hooks/useResearch";

export default function ResearchAuthorsPage() {
  const { data: authors, isLoading, isError } = useResearchAuthors();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Researchers</span>}
          subtitle="Browse authors and their published research outputs"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Research", href: "/research" },
            { label: "Researchers" },
          ]}
        />

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            Failed to load researchers. Please try again.
          </div>
        )}

        {!isLoading && !isError && (!authors || authors.length === 0) && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border-default)]">
            <Users size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
            <p className="font-semibold text-[var(--color-fg-default)]">No researchers yet</p>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Once outputs are published, authors will appear here.</p>
          </div>
        )}

        {!isLoading && authors && authors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {authors.map((author) => (
              <Link
                key={author.user_id}
                href={`/research/authors/${author.user_id}`}
                className="gh-box p-4 flex items-center gap-4 hover:border-[var(--color-accent-fg)] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--theme-gradient-135,linear-gradient(135deg,#1a1a2e_0%,#111116_100%))] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-extrabold text-white select-none">
                    {author.name[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--color-fg-default)] truncate">{author.name}</p>
                  <p className="text-xs text-[var(--color-fg-muted)] truncate">{author.department || "Digital Knowledge Platform"}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--color-fg-subtle)]">
                    <span className="flex items-center gap-1"><FileText size={11} /> {author.output_count} output{author.output_count !== "1" ? "s" : ""}</span>
                    {author.latest_publication && (
                      <span className="flex items-center gap-1"><BookOpen size={11} /> {new Date(author.latest_publication).getFullYear()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
