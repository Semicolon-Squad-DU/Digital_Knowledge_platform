"use client";

import Link from "next/link";
import { ArrowLeft, FileText, RefreshCw, PenLine, AlertTriangle, Activity } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBorrowingHistory } from "@/features/library/hooks/useLibrary";
import { useArchiveSearch } from "@/features/archive/hooks/useArchive";
import { useResearchList } from "@/features/research/hooks/useResearch";
import { useShowcaseGallery } from "@/features/showcase/hooks/useShowcase";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";

interface Loan        { transaction_id: string; title: string; due_date: string; status: string; }
interface ArchiveItem { item_id: string; title_en: string; category: string; created_at: string; uploader_name?: string; }
interface Research    { output_id: string; title: string; output_type: string; published_date: string; authors?: { name: string }[]; }
interface Showcase    { project_id: string; title: string; status: string; submitted_at: string; author_name?: string; }

const PILL: Record<string, { bg: string; color: string }> = {
  published:      { bg: "#dcfce7", color: "#15803d" },
  active:         { bg: "#dcfce7", color: "#15803d" },
  approved:       { bg: "#dcfce7", color: "#15803d" },
  pending:        { bg: "#dbeafe", color: "#1d4ed8" },
  pending_review: { bg: "#dbeafe", color: "#1d4ed8" },
  review:         { bg: "#dbeafe", color: "#1d4ed8" },
  error:          { bg: "#fee2e2", color: "#dc2626" },
  overdue:        { bg: "#fee2e2", color: "#dc2626" },
  draft:          { bg: "#f3f4f6", color: "#6b7280" },
};

function StatusPill({ status }: { status: string }) {
  const s = PILL[status.toLowerCase()] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: s.bg, color: s.color }}>
      {status.replace("_", " ")}
    </span>
  );
}

function AIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
    archive:  { icon: FileText,      bg: "#eff6ff", color: "#3b82f6" },
    research: { icon: RefreshCw,     bg: "#f0fdf4", color: "#22c55e" },
    showcase: { icon: PenLine,       bg: "#fdf4ff", color: "#a855f7" },
    overdue:  { icon: AlertTriangle, bg: "#fef2f2", color: "#ef4444" },
  };
  const m = map[type] ?? { icon: FileText, bg: "#f3f4f6", color: "#6b7280" };
  const Icon = m.icon;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} color={m.color} />
    </div>
  );
}

export default function DashboardActivityPage() {
  const { user, ready } = useAuthGuard();

  const { data: archiveData,  isLoading: archLoading } = useArchiveSearch({ query: "", page: 1, limit: 30 });
  const { data: researchData, isLoading: resLoading  } = useResearchList({ page: 1, limit: 30 });
  const { data: showcaseData, isLoading: showLoading } = useShowcaseGallery({ page: 1, limit: 30 });
  const { data: history,      isLoading: histLoading } = useBorrowingHistory(user?.user_id ?? "");

  if (!ready) return null;

  const overdueLoans = ((history ?? []) as Loan[]).filter(t => t.status === "overdue");
  const isLoading = archLoading || resLoading || showLoading || histLoading;

  type Entry = { id: string; type: string; actor: string; action: string; subject: string; status: string; time: string };
  const feed: Entry[] = [
    ...((archiveData?.items ?? []) as ArchiveItem[]).map(item => ({
      id: `a-${item.item_id}`, type: "archive",
      actor: item.uploader_name ?? "System",
      action: "uploaded", subject: `"${item.title_en}"`,
      status: "active", time: item.created_at,
    })),
    ...((researchData?.items ?? []) as Research[]).map(r => ({
      id: `r-${r.output_id}`, type: "research",
      actor: r.authors?.[0]?.name ?? "Researcher",
      action: "published", subject: `"${r.title}"`,
      status: "published", time: r.published_date,
    })),
    ...((showcaseData?.items ?? []) as Showcase[]).map(p => ({
      id: `s-${p.project_id}`, type: "showcase",
      actor: p.author_name ?? "Student",
      action: "submitted", subject: `"${p.title}"`,
      status: p.status, time: p.submitted_at,
    })),
    ...overdueLoans.map(loan => ({
      id: `l-${loan.transaction_id}`, type: "overdue",
      actor: "Integrity check",
      action: "flagged", subject: `"${loan.title}"`,
      status: "error", time: loan.due_date,
    })),
  ]
    .filter(e => !!e.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <AppLayout>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#6b7280", textDecoration: "none", marginBottom: 10 }}>
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={17} color="var(--avatar-theme-color, #111827)" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>Recent Activity</h1>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0 46px" }}>
            Recently uploaded archive documents, published research, showcase submissions, and overdue-loan flags.
          </p>
        </div>

        <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "0 20px" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: i < 7 ? "1px solid #f9fafb" : "none" }}>
                    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3 w-12 shrink-0" />
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div style={{ padding: "52px 20px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Activity size={20} color="#9ca3af" />
                </div>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No recent activity to display.</p>
              </div>
            ) : (
              feed.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 20px", borderBottom: i < feed.length - 1 ? "1px solid #f9fafb" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <AIcon type={entry.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "#111827", margin: "0 0 5px", lineHeight: 1.45 }}>
                      <strong>{entry.actor}</strong> {entry.action} {entry.subject}.
                    </p>
                    <StatusPill status={entry.status} />
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", marginTop: 2, flexShrink: 0 }}>
                    {timeAgo(entry.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
