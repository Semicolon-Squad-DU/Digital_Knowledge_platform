"use client";

import { useQuery } from "@tanstack/react-query";
import { FlaskConical, User, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { useLabs } from "@/features/research/hooks/useResearch";

interface Lab {
  lab_id: string;
  name: string;
  description?: string;
  head_researcher_id: string;
  head_name: string;
}

export default function LabsDirectoryPage() {
  const { data: labs, isLoading, isError } = useLabs();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Research Labs & Groups</span>}
          subtitle="Explore different research centers and labs at the institution"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Research", href: "/research" },
            { label: "Labs" },
          ]}
        />

        {isLoading && (
          <div className="text-center py-16 text-sm text-slate-500">
            Loading research labs...
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-sm text-red-500">
            Failed to load labs directory. Please try again.
          </div>
        )}

        {!isLoading && !isError && (!labs || labs.length === 0) && (
          <div className="text-center py-16 text-[var(--color-fg-muted)]">
            <FlaskConical size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No research labs registered yet.</p>
          </div>
        )}

        {!isLoading && !isError && labs && labs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab: Lab) => (
              <div key={lab.lab_id} className="gh-box flex flex-col justify-between">
                <div className="gh-box-body space-y-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={18} className="text-[var(--color-accent-fg)]" />
                    <h3 className="font-bold text-base text-[var(--color-fg-default)]">{lab.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-fg-muted)] line-clamp-3 leading-relaxed">
                    {lab.description || "No description provided for this research group."}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)] pt-1">
                    <User size={13} />
                    <span>Head: <strong className="text-[var(--color-fg-default)]">{lab.head_name}</strong></span>
                  </div>
                </div>

                <div className="bg-[var(--color-canvas-subtle)] px-6 py-3 border-t border-[var(--color-border-default)] flex justify-end">
                  <Link
                    href={`/research/labs/${lab.lab_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-fg)] hover:underline"
                  >
                    View Portfolio <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
