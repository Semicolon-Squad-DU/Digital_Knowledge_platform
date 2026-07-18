"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Building2, Shield, BookOpen, Calendar, FileText, FlaskConical } from "lucide-react";
import api from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface PublicProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = params?.id ?? "";

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useQuery({
    queryKey: ["auth", "profile", profileId],
    queryFn: async () => {
      const { data } = await api.get(`/auth/profile/${profileId}`);
      return data.data as PublicProfile;
    },
    enabled: !!profileId,
  });

  const { data: researchData, isLoading: isResearchLoading } = useQuery({
    queryKey: ["research", "by-user", profileId],
    queryFn: async () => {
      const { data } = await api.get(`/research`, { params: { uploaded_by: profileId } });
      return data.data.items;
    },
    enabled: !!profileId,
  });

  if (isProfileLoading) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center text-sm text-slate-500">
          Loading researcher profile...
        </div>
      </AppLayout>
    );
  }

  if (isProfileError || !profile) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <User size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Profile Not Found</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">The requested user profile does not exist.</p>
        </div>
      </AppLayout>
    );
  }

  const publications = researchData || [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Researcher Profile</span>}
          subtitle="Public academic profile and publications"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Researchers" },
            { label: profile.name },
          ]}
        />

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <div className="gh-box overflow-hidden mb-6">
          <div className="bg-[var(--theme-gradient-135,linear-gradient(135deg,#1a1a2e_0%,#111116_100%))] p-8 text-center relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white mx-auto mb-4 border-4 border-white/20 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-extrabold text-[#141b2b] select-none">
                {profile.name[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
            <p className="text-xs text-white/70 capitalize">
              {profile.role.replace(/_/g, " ")} · {profile.department || "Digital Knowledge Platform"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-t border-[var(--color-border-default)]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <User size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Role</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)] capitalize">{profile.role.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{profile.department || "Computer Science & Engineering"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-canvas-subtle)] flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-bold uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-[var(--color-fg-default)]">{formatDate(profile.created_at)}</p>
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
              {profile.bio || "No biography provided yet."}
            </p>
          </div>
        </div>

        {/* ── PUBLICATIONS ─────────────────────────────────────────────── */}
        <div className="gh-box">
          <div className="gh-box-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              Publications & Research Outputs
            </h2>
            <span className="text-xs bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] px-2.5 py-1 rounded-full font-bold">
              {publications.length} Work{publications.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="gh-box-body divide-y divide-[var(--color-border-default)]">
            {isResearchLoading && (
              <p className="text-sm text-center text-[var(--color-fg-muted)] py-4">Loading publications…</p>
            )}

            {!isResearchLoading && publications.length === 0 && (
              <div className="text-center py-8 text-[var(--color-fg-muted)]">
                <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No research outputs published yet.</p>
              </div>
            )}

            {!isResearchLoading && publications.length > 0 && (
              <div className="space-y-4 pt-2">
                {publications.map((paper: any) => (
                  <div key={paper.output_id} className="pt-4 first:pt-0 pb-1">
                    <Link
                      href={`/research/${paper.output_id}`}
                      className="font-semibold text-sm hover:underline text-[var(--color-accent-fg)] block"
                    >
                      {paper.title}
                    </Link>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-1 line-clamp-2">
                      {paper.abstract}
                    </p>
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
