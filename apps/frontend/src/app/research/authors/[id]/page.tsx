"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, Calendar, BookOpen, FlaskConical, Crown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";
import { useResearchAuthor } from "@/features/research/hooks/useResearch";

export default function ResearchAuthorProfilePage() {
  const params = useParams<{ id: string }>();
  const authorId = params?.id ?? "";

  const { data: author, isLoading, isError } = useResearchAuthor(authorId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center text-sm text-slate-500">
          Loading author profile…
        </div>
      </AppLayout>
    );
  }

  if (isError || !author) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <User size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Author Not Found</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">The requested author profile does not exist.</p>
        </div>
      </AppLayout>
    );
  }

  const affiliations = [
    ...author.head_of_labs.map((l) => ({ ...l, role: "Lab Head" })),
    ...author.labs.filter((l) => !author.head_of_labs.some((h) => h.lab_id === l.lab_id)),
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">{author.name}</span>}
          subtitle="Research author profile"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Research", href: "/research" },
            { label: "Researchers", href: "/research/authors" },
            { label: author.name },
          ]}
        />

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <div className="gh-box overflow-hidden mb-6">
          <div className="bg-[var(--theme-gradient-135,linear-gradient(135deg,#1a1a2e_0%,#111116_100%))] p-8 text-center relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white mx-auto mb-4 border-4 border-white/20 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-extrabold text-[#111827] select-none">
                {author.name[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{author.name}</h2>
            <p className="text-xs text-white/70 capitalize">
              {author.role.replace(/_/g, " ")} · {author.department || "Digital Knowledge Platform"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-t border-[var(--color-border-default)]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{author.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{author.department || "Computer Science & Engineering"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <BookOpen size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Publications</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{author.publications.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{formatDate(author.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BIO ───────────────────────────────────────────────────────── */}
        <div className="gh-box mb-6">
          <div className="gh-box-header">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">About</h2>
          </div>
          <div className="gh-box-body">
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              {author.bio || "No biography provided yet."}
            </p>
          </div>
        </div>

        {/* ── LAB AFFILIATIONS ─────────────────────────────────────────── */}
        {affiliations.length > 0 && (
          <div className="gh-box mb-6">
            <div className="gh-box-header">
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">Lab Affiliations</h2>
            </div>
            <div className="gh-box-body space-y-2">
              {affiliations.map((lab) => (
                <Link
                  key={lab.lab_id}
                  href={`/research/labs/${lab.lab_id}`}
                  className="flex items-center justify-between p-3 bg-[var(--color-canvas-subtle)] rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-accent-fg)] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg-default)]">
                    <FlaskConical size={14} className="text-[var(--color-fg-muted)]" />
                    {lab.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-[var(--color-fg-muted)]">
                    {lab.role === "Lab Head" && <Crown size={11} className="text-amber-500" />}
                    {lab.role}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── PUBLICATIONS ─────────────────────────────────────────────── */}
        <div className="gh-box">
          <div className="gh-box-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              Publications & Research Outputs
            </h2>
            <span className="text-xs bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] px-2.5 py-1 rounded-full font-bold">
              {author.publications.length} Work{author.publications.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="gh-box-body divide-y divide-[var(--color-border-default)]">
            {author.publications.length === 0 && (
              <div className="text-center py-8 text-[var(--color-fg-muted)]">
                <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No research outputs published yet.</p>
              </div>
            )}

            {author.publications.length > 0 && (
              <div className="space-y-4 pt-2">
                {author.publications.map((paper) => (
                  <div key={paper.output_id} className="pt-4 first:pt-0 pb-1">
                    <Link
                      href={`/research/${paper.output_id}`}
                      className="font-semibold text-sm hover:underline text-[var(--color-accent-fg)] block"
                    >
                      {paper.title}
                    </Link>
                    {paper.abstract && (
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1 line-clamp-2">
                        {paper.abstract}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[var(--color-fg-subtle)]">
                      <span className="capitalize">{paper.output_type}</span>
                      <span>·</span>
                      <code>{paper.dkp_identifier}</code>
                      {paper.published_date && (
                        <>
                          <span>·</span>
                          <span>{new Date(paper.published_date).getFullYear()}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
