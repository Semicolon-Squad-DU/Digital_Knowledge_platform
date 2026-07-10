"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { FlaskConical, User, BookOpen, Mail, Building2, Calendar, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface LabDetails {
  lab: {
    lab_id: string;
    name: string;
    description?: string;
    head_researcher_id: string;
    head_name: string;
    head_email: string;
  };
  members: Array<{
    joined_at: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  }>;
  outputs: Array<{
    output_id: string;
    title: string;
    abstract?: string;
    output_type: string;
    dkp_identifier: string;
    published_date?: string;
  }>;
}

export default function LabDetailPage() {
  const params = useParams<{ id: string }>();
  const labId = params?.id ?? "";

  const { data: labData, isLoading, isError } = useQuery({
    queryKey: ["research", "lab-detail", labId],
    queryFn: async () => {
      const { data } = await api.get(`/research/labs/${labId}`);
      return data.data as LabDetails;
    },
    enabled: !!labId,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center text-sm text-slate-500">
          Loading lab portfolio...
        </div>
      </AppLayout>
    );
  }

  if (isError || !labData) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <FlaskConical size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Lab Not Found</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">The requested research lab profile does not exist.</p>
        </div>
      </AppLayout>
    );
  }

  const { lab, members, outputs } = labData;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">{lab.name}</span>}
          subtitle="Research group and lab portfolio"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Research", href: "/research" },
            { label: "Labs", href: "/research/labs" },
            { label: lab.name },
          ]}
        />

        {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
        <div className="gh-box overflow-hidden mb-6">
          <div className="bg-[var(--theme-gradient-135,linear-gradient(135deg,#1a1a2e_0%,#111116_100%))] p-8 relative flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md">
              <FlaskConical size={32} className="text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">{lab.name}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <User size={13} />
                  Head: <Link href={`/research/authors/${lab.head_researcher_id}`} className="text-white font-semibold hover:underline">{lab.head_name}</Link>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail size={13} />
                  {lab.head_email}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-[var(--color-border-default)]">
            <h3 className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-[var(--color-fg-default)] leading-relaxed">
              {lab.description || "No detailed description has been uploaded for this research lab."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── PUBLICATIONS (Left 2 columns) ─────────────────────────────── */}
          <div className="md:col-span-2 space-y-6">
            <div className="gh-box">
              <div className="gh-box-header flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
                  Research Outputs & Publications
                </h2>
                <span className="text-xs bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] px-2.5 py-1 rounded-full font-bold">
                  {outputs.length} Work{outputs.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="gh-box-body divide-y divide-[var(--color-border-default)]">
                {outputs.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-fg-muted)]">
                    <BookOpen size={24} className="mx-auto mb-2 opacity-45" />
                    <p className="text-sm">No lab publications uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {outputs.map((paper) => (
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
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-fg-subtle)]">
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

          {/* ── LAB MEMBERS (Right column) ─────────────────────────────────── */}
          <div>
            <div className="gh-box">
              <div className="gh-box-header flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
                  Lab Members
                </h2>
                <span className="text-xs bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] px-2 py-0.5 rounded-full font-bold">
                  {members.length}
                </span>
              </div>

              <div className="gh-box-body space-y-4">
                {members.length === 0 ? (
                  <p className="text-xs text-center text-[var(--color-fg-muted)]">No registered members.</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.user_id} className="p-3 bg-[var(--color-canvas-subtle)] rounded-lg border border-[var(--color-border-default)]">
                        <Link
                          href={`/research/authors/${member.user_id}`}
                          className="text-sm font-bold text-[var(--color-fg-default)] hover:underline hover:text-[var(--color-accent-fg)] block"
                        >
                          {member.name}
                        </Link>
                        <p className="text-[10px] text-[var(--color-fg-muted)] uppercase font-semibold mt-0.5">{member.role.replace(/_/g, " ")}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-fg-subtle)] mt-2">
                          <Mail size={10} />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
