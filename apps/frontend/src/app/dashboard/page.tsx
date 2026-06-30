"use client";

import Link from "next/link";
import {
  Search, Plus, FileText, RefreshCw, PenLine,
  AlertTriangle, FolderOpen, HardDrive, Lock, Database,
  ArrowRight, TrendingUp, CheckCircle, BookOpen, Heart,
  Clock, Archive, Activity, LayoutDashboard,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBorrowingHistory, useMemberFines, useWishlist } from "@/features/library/hooks/useLibrary";
import { useArchiveSearch } from "@/features/archive/hooks/useArchive";
import { useResearchList } from "@/features/research/hooks/useResearch";
import { useShowcaseGallery } from "@/features/showcase/hooks/useShowcase";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";

interface Loan        { transaction_id: string; title: string; due_date: string; status: string; }
interface ArchiveItem { item_id: string; title_en: string; category: string; created_at: string; uploader_name?: string; }
interface Research    { output_id: string; title: string; output_type: string; published_date: string; authors?: { name: string }[]; }
interface Showcase    { project_id: string; title: string; status: string; submitted_at: string; author_name?: string; }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const PILL: Record<string, { bg: string; color: string }> = {
  published:      { bg: "#dcfce7", color: "#15803d" },
  success:        { bg: "#dcfce7", color: "#15803d" },
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
    loan:     { icon: FolderOpen,    bg: "#fff7ed", color: "#f97316" },
  };
  const m = map[type] ?? { icon: FileText, bg: "#f3f4f6", color: "#6b7280" };
  const Icon = m.icon;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={15} color={m.color} />
    </div>
  );
}

function StatCard({ label, value, sub, subIcon, subColor, loading, icon: CardIcon, iconBg, iconColor, accent }: {
  label: string; value: string | number; sub?: string;
  subIcon?: React.ElementType; subColor?: string; loading?: boolean;
  icon?: React.ElementType; iconBg?: string; iconColor?: string; accent?: string;
}) {
  const SubIcon = subIcon;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: "20px 22px", position: "relative", overflow: "hidden",
    }}>
      {accent && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />
      )}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: 0 }}>
              {label}
            </p>
            {CardIcon && (
              <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg ?? "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CardIcon size={16} color={iconColor ?? "#6b7280"} />
              </div>
            )}
          </div>
          <p style={{ fontSize: 34, fontWeight: 800, color: "#111827", lineHeight: 1, margin: "0 0 10px" }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 12, color: subColor ?? "#6b7280", display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
              {SubIcon && <SubIcon size={12} />}
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, ready } = useAuthGuard();
  const isMobile        = useMediaQuery("(max-width: 767px)");
  const isTablet        = useMediaQuery("(max-width: 1023px)");

  const { data: history,      isLoading: histLoading } = useBorrowingHistory(user?.user_id ?? "");
  const { data: fineData                              } = useMemberFines(user?.user_id ?? "");
  const { data: wishlist                              } = useWishlist();
  const { data: archiveData,  isLoading: archLoading } = useArchiveSearch({ query: "", page: 1, limit: 5 });
  const { data: researchData, isLoading: resLoading  } = useResearchList({ page: 1, limit: 5 });
  const { data: showcaseData, isLoading: showLoading } = useShowcaseGallery({ page: 1, limit: 5 });

  if (!ready) return null;

  const overdueLoans   = (history ?? []).filter((t: Loan) => t.status === "overdue");
  const returnedLoans  = (history ?? []).filter((t: Loan) => t.status === "returned");
  const totalDocs      = archiveData?.total ?? 0;
  const publishedItems = researchData?.total ?? 0;
  const pendingReviews = (showcaseData?.items ?? []).filter((p: Showcase) =>
    ["pending_review", "review", "pending"].includes(p.status)).length;
  const archivedItems  = returnedLoans.length;

  type Entry = { id: string; type: string; actor: string; action: string; subject: string; status: string; time: string; };
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
    ...(overdueLoans as Loan[]).map(loan => ({
      id: `l-${loan.transaction_id}`, type: "overdue",
      actor: "Integrity check",
      action: "flagged", subject: `"${loan.title}"`,
      status: "error", time: loan.due_date,
    })),
  ]
    .filter(e => !!e.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  const actLoading = archLoading || resLoading || showLoading;
  const statCols   = isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const firstName  = user?.name?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ──────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "28px 18px 26px" : "36px 40px 34px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LayoutDashboard size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{
                  fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#0f1117",
                  margin: 0, letterSpacing: "-0.03em",
                }}>
                  {getGreeting()}, {firstName}.
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                {todayLabel()}
              </p>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/archive"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 9,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none",
                  transition: "border-color 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#9ca3af")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
              >
                <Search size={13} /> Search Archive
              </Link>
              <Link
                href="/showcase/submit"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 9,
                  background: "var(--avatar-theme-color, #1a1a2e)",
                  border: "none",
                  fontSize: 13, fontWeight: 700,
                  color: "#fff",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={13} /> New Submission
              </Link>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "18px 16px" : "24px 40px" }}>

          {/* Fine warning */}
          {fineData?.total_pending > 0 && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
              padding: "12px 16px", color: "#991b1b", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8, marginBottom: 22,
            }}>
              <AlertTriangle size={15} />
              You have outstanding library fines of BDT {fineData.total_pending}. Please clear them soon.
            </div>
          )}

          {/* ── Stat cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: statCols, gap: 14, marginBottom: 24 }}>
            {user?.role === "member" ? (
              <>
                <StatCard
                  label="Active Loans" icon={BookOpen} iconBg="#eff6ff" iconColor="#3b82f6" accent="#3b82f6"
                  value={(history ?? []).filter((t: Loan) => t.status === "active").length}
                  sub="Books currently checked out" loading={histLoading}
                />
                <StatCard
                  label="Overdue Books" icon={AlertTriangle} iconBg="#fef2f2" iconColor="#ef4444"
                  accent={overdueLoans.length > 0 ? "#ef4444" : "#e5e7eb"}
                  value={overdueLoans.length}
                  sub={overdueLoans.length > 0 ? "Fines accumulating" : "All returned on time"}
                  subColor={overdueLoans.length > 0 ? "#ef4444" : "#16a34a"} loading={histLoading}
                />
                <StatCard
                  label="Outstanding Fines" icon={Clock} iconBg="#fff7ed" iconColor="#f97316" accent="#f97316"
                  value={`BDT ${fineData?.total_pending ?? 0}`}
                  sub="Due to late returns"
                  subColor={fineData?.total_pending > 0 ? "#ef4444" : "#6b7280"} loading={histLoading}
                />
                <StatCard
                  label="Wishlist Saved" icon={Heart} iconBg="#fdf4ff" iconColor="#a855f7" accent="#a855f7"
                  value={wishlist?.length ?? 0}
                  sub="Books saved for later" loading={histLoading}
                />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Documents" icon={Database} iconBg="#eff6ff" iconColor="#3b82f6" accent="#3b82f6"
                  value={totalDocs.toLocaleString()}
                  sub={archiveData ? `+${archiveData.items?.length ?? 0} recent` : undefined}
                  subIcon={TrendingUp} subColor="#16a34a" loading={archLoading}
                />
                <StatCard
                  label="Published Items" icon={CheckCircle} iconBg="#f0fdf4" iconColor="#22c55e" accent="#22c55e"
                  value={publishedItems.toLocaleString()}
                  sub={publishedItems > 0 ? "Verified & indexed" : "No published items"}
                  loading={resLoading}
                />
                <StatCard
                  label="Pending Reviews" icon={Clock} iconBg="#fff7ed" iconColor="#f97316"
                  accent={pendingReviews > 0 ? "#f97316" : "#e5e7eb"}
                  value={pendingReviews}
                  sub={pendingReviews > 0 ? `${pendingReviews} need attention` : "No pending reviews"}
                  subColor={pendingReviews > 0 ? "#f97316" : "#6b7280"} loading={showLoading}
                />
                <StatCard
                  label="Archived Items" icon={Archive} iconBg="#f5f3ff" iconColor="#8b5cf6" accent="#8b5cf6"
                  value={archivedItems.toLocaleString()}
                  sub="Legacy data stored" loading={histLoading}
                />
              </>
            )}
          </div>

          {/* ── Middle row: activity + feature cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 290px", gap: 18, marginBottom: 18 }}>

            {/* Recent Activity */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={15} color="var(--avatar-theme-color, #111827)" />
                  </div>
                  <h2 style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", margin: 0 }}>Recent Activity</h2>
                </div>
                <Link
                  href="/notifications"
                  style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--avatar-theme-color, #111827)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>

              {actLoading ? (
                <div style={{ padding: "0 20px" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: i < 4 ? "1px solid #f9fafb" : "none" }}>
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

            {/* Right: Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Library card */}
              <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", position: "relative", background: "#0f172a", minHeight: 185, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
                <div style={{ position: "absolute", inset: 0, background: "var(--theme-gradient-160)", opacity: 0.85 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Quick Access</p>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 5px" }}>Library Catalog</h3>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 14px" }}>
                    Academic journals, books &amp; peer-reviewed papers.
                  </p>
                  <Link
                    href="/library"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 7, padding: "6px 12px", background: "rgba(255,255,255,0.1)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  >
                    Browse <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              {/* Archive card */}
              <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", position: "relative", background: "#1e293b", minHeight: 185, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
                <div style={{ position: "absolute", inset: 0, background: "var(--theme-gradient-160)", opacity: 0.7 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Quick Access</p>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 5px" }}>Digital Archive</h3>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 14px" }}>
                    Historic preservation &amp; legacy academic records.
                  </p>
                  <Link
                    href="/archive"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 7, padding: "6px 12px", background: "rgba(255,255,255,0.1)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  >
                    Explore <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── System status bar ── */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)" }}>
            {[
              {
                icon: HardDrive, iconBg: "#eff6ff", iconColor: "#3b82f6",
                label: "Storage Capacity",
                value: totalDocs > 0 ? `${Math.min(99, Math.round((totalDocs / 500) * 82))}% of 50 TB utilized` : "Calculating…",
              },
              {
                icon: Lock, iconBg: "#f0fdf4", iconColor: "#22c55e",
                label: "Security Status",
                value: "SSL Certified & Encrypted",
              },
              {
                icon: Database, iconBg: "#f5f3ff", iconColor: "#8b5cf6",
                label: "Last Backup",
                value: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " · 04:00 AM",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "18px 24px",
                  borderRight: !isMobile && i < 2 ? "1px solid #e5e7eb" : "none",
                  borderBottom: isMobile && i < 2 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={17} color={item.iconColor} />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 3px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
