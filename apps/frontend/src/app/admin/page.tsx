"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  FileText, RefreshCw, Pencil, Trash2, Filter, ChevronLeft, ChevronRight,
  Users, HardDrive, AlertCircle, Search, BookOpen, Lock, Check, X,
  ShieldCheck, Settings, Database, Bell, Activity, UserCog, Eye,
  Download, UserCheck, Ban, RotateCcw, LayoutDashboard,
  ClipboardList, Server, Zap, Mail, Slack, Calendar, FlaskConical, Archive, GraduationCap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  useAdminStats, useCatalogDocuments, useResearcherSubmissions, useArchiveDocuments,
  useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser,
  useAdminConfigs, useUpdateAdminConfigs, useAdminAuditLogs, useAdminHealth,
  useApproveUser, useBackups, useGenerateBackup, useDownloadBackup, useRestoreBackup,
  useBackupSchedule, useUpdateBackupSchedule, type BackupRecord,
  useAnnouncements, useBroadcastAnnouncement, type Announcement,
  useMostAccessedResources, useUsageAnalytics, useEngagementAnalytics, useSearchAnalytics, exportAnalyticsCsv,
} from "@/hooks/useAdmin";
import { useBorrowingHistory, useMemberHolds, useMemberFines } from "@/features/library/hooks/useLibrary";
import { useShowcaseGallery } from "@/features/showcase/hooks/useShowcase";
import { usePendingAccessRequests, useReviewAccessRequest } from "@/features/archive/hooks/useArchive";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab = "overview" | "users" | "audit" | "config" | "backups" | "alerts" | "announcements" | "analytics";

// ── Responsive helper ─────────────────────────────────────────────────────────
const getResponsiveStyle = (isMobile: boolean) => ({
  containerPadding: isMobile ? "16px" : "28px 32px",
  statGridCols: isMobile ? 1 : 2,
  quickActionGridCols: isMobile ? 1 : 3,
  analyticsGridCols: isMobile ? 1 : 2,
  configGridCols: isMobile ? 1 : 2,
  headingFontSize: isMobile ? 22 : 28,
  tabGap: isMobile ? 0 : 2,
  tabPadding: isMobile ? "8px 12px" : "10px 16px",
});

// ── Status pill map ───────────────────────────────────────────────────────────
const PILL: Record<string, { bg: string; color: string }> = {
  published:    { bg: "#e6f4ea", color: "#1e7e34" },
  active:       { bg: "#e6f4ea", color: "#1e7e34" },
  approved:     { bg: "#e6f4ea", color: "#1e7e34" },
  pending:      { bg: "#e8f0fe", color: "#0D47A1" },
  pending_review:{ bg: "#e8f0fe", color: "#0D47A1" },
  review:       { bg: "#e8f0fe", color: "#0D47A1" },
  suspended:    { bg: "#fde8e8", color: "#c81e1e" },
  overdue:      { bg: "#fde8e8", color: "#c81e1e" },
  inactive:     { bg: "#f1f3ff", color: "#555f6d" },
  draft:        { bg: "#f1f3ff", color: "#555f6d" },
  returned:     { bg: "#f1f3ff", color: "#555f6d" },
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:          { bg: "#fef3c7", color: "#92400e" },
  librarian:      { bg: "#ede9fe", color: "#5b21b6" },
  archivist:      { bg: "#dbeafe", color: "#1e40af" },
  researcher:     { bg: "#d1fae5", color: "#065f46" },
  student_author: { bg: "#fce7f3", color: "#9d174d" },
  member:         { bg: "#f0f9ff", color: "#0369a1" },
  guest:          { bg: "#f1f3ff", color: "#555f6d" },
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE:        { bg: "#d1fae5", color: "#065f46" },
  UPDATE:        { bg: "#dbeafe", color: "#1e40af" },
  DELETE:        { bg: "#fde8e8", color: "#c81e1e" },
  ACCESS:        { bg: "#f0f9ff", color: "#0369a1" },
  LOGIN:         { bg: "#ede9fe", color: "#5b21b6" },
  LOGOUT:        { bg: "#f1f3ff", color: "#555f6d" },
  DOWNLOAD:      { bg: "#fef3c7", color: "#92400e" },
  STATUS_CHANGE: { bg: "#fce7f3", color: "#9d174d" },
};

// ── Shared sub-components ─────────────────────────────────────────────────────
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 5,
      fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.4px",
      background: bg, color,
    }}>
      {label.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "var(--avatar-theme-color)" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#555f6d", fontWeight: 700, margin: 0, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#141b2b", margin: "4px 0 0" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: "#78767d", margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#141b2b", margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: 13, color: "#555f6d", margin: "4px 0 0" }}>{desc}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "12px 20px", gap: 12 }}>
      {cols.map(c => (
        <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px", textTransform: "uppercase" }}>{c}</div>
      ))}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color = "#47464c", bg = "#f1f3ff", onClick }: {
  icon: React.ElementType; label: string; color?: string; bg?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={label} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "5px 10px", borderRadius: 5, border: "none",
      background: bg, color, fontSize: 11, fontWeight: 600, cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ adminStats, statsLoading, setActiveTab }: { adminStats: any; statsLoading: boolean; setActiveTab: (tab: any) => void }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const { data: pendingRequests, refetch: refetchRequests } = usePendingAccessRequests();
  const { mutateAsync: reviewRequest } = useReviewAccessRequest();
  const { data: mostAccessed, isLoading: mostAccessedLoading } = useMostAccessedResources();
  const [denyRequestId, setDenyRequestId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [submittingDeny, setSubmittingDeny] = useState(false);

  const handleApprove = async (requestId: string) => {
    try {
      await reviewRequest({ requestId, status: "approved" });
      toast.success("Access request approved successfully");
      refetchRequests();
    } catch (err: any) {
      toast.error("Failed to approve access request");
    }
  };

  const handleDenySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denyRequestId) return;
    setSubmittingDeny(true);
    try {
      await reviewRequest({ requestId: denyRequestId, status: "denied", rejection_message: rejectionMessage });
      toast.success("Access request denied successfully");
      setDenyRequestId(null);
      setRejectionMessage("");
      refetchRequests();
    } catch (err: any) {
      toast.error("Failed to deny access request");
    } finally {
      setSubmittingDeny(false);
    }
  };

  const statGridCols = isMobile ? 1 : isTablet ? 2 : 4;

  return (
    <div>
      <SectionHeader title="Platform Overview" desc="Real-time snapshot of platform activity, security audit trail, and analytical insights." />

      {/* Stat grid - responsive */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${statGridCols}, 1fr)`, gap: isMobile ? 12 : 16, marginBottom: 28 }}>
        <StatCard label="Total Users" value={statsLoading ? "—" : (adminStats?.totalUsers ?? 0).toLocaleString()} sub="registered accounts" icon={Users} />
        <StatCard label="Total Documents" value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()} sub="archive & library" icon={FileText} />
        <StatCard label="Active This Month" value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()} sub="unique logins" icon={Activity} />
        <StatCard label="Storage Used" value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 1}%`} sub={statsLoading ? "of total capacity" : `${formatFileSize(adminStats?.storageUsedBytes ?? 0)} of ${formatFileSize(adminStats?.storageCapacityBytes ?? 0)}`} icon={HardDrive} accent="#dc2626" />
      </div>

      {/* Analytics Dashboards & Trends - responsive */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Upload and Download Trends (Sleek Visual SVG Chart) */}
        <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 4px" }}>Engagement & Transfer Trends</h3>
          <p style={{ fontSize: 12, color: "#555f6d", margin: "0 0 20px" }}>Monthly comparisons of resource uploads vs. downloads</p>
          
          <div style={{ position: "relative", height: 180, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 10px 20px", borderBottom: "1px solid #f1f3ff" }}>
            {/* Background grids */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 20, borderTop: "1px dashed #f1f3ff" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 70, borderTop: "1px dashed #f1f3ff" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 120, borderTop: "1px dashed #f1f3ff" }} />
            
            {/* Columns */}
            {(() => {
              const trends = adminStats?.monthlyTrends ?? [];
              const maxValue = Math.max(1, ...trends.flatMap(t => [t.uploads, t.downloads]));
              return trends.map(item => (
                <div key={item.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                    <div title={`Uploads: ${item.uploads}`} style={{ width: 14, height: `${Math.min(100, (item.uploads / maxValue) * 100)}%`, background: "#bae6fd", borderRadius: "3px 3px 0 0", transition: "height 0.3s" }} />
                    <div title={`Downloads: ${item.downloads}`} style={{ width: 14, height: `${Math.min(100, (item.downloads / maxValue) * 100)}%`, background: "var(--avatar-theme-color)", borderRadius: "3px 3px 0 0", transition: "height 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#78767d" }}>{item.month}</span>
                </div>
              ));
            })()}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#bae6fd" }} />
              <span style={{ fontSize: 11, color: "#555f6d", fontWeight: 600 }}>Uploads</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--avatar-theme-color)" }} />
              <span style={{ fontSize: 11, color: "#555f6d", fontWeight: 600 }}>Downloads</span>
            </div>
          </div>
        </div>

        {/* Resource Usage & Distribution */}
        <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 16px" }}>Resource Usage Metrics</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                label: "Archive Items",
                count: `${adminStats?.archiveCount ?? 0} items`,
                pct: Math.round(((adminStats?.archiveCount ?? 0) / Math.max(1, (adminStats?.totalDocuments ?? 1))) * 100),
                color: "#0284c7"
              },
              {
                label: "Library Catalog Items",
                count: `${adminStats?.catalogCount ?? 0} items`,
                pct: Math.round(((adminStats?.catalogCount ?? 0) / Math.max(1, (adminStats?.totalDocuments ?? 1))) * 100),
                color: "#7c3aed"
              },
              {
                label: "Student Showcases",
                count: `${adminStats?.showcaseCount ?? 0} items`,
                pct: Math.round(((adminStats?.showcaseCount ?? 0) / Math.max(1, (adminStats?.totalDocuments ?? 1) + (adminStats?.showcaseCount ?? 0))) * 100),
                color: "#16a34a"
              },
            ].map(res => (
              <div key={res.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", marginBottom: 6, gap: isMobile ? 4 : 0 }}>
                  <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#47464c", flex: isMobile ? 1 : "auto" }}>{res.label}</span>
                  <span style={{ fontSize: 10, color: "#78767d", fontWeight: 600, whiteSpace: "nowrap" }}>{res.count}</span>
                </div>
                <div style={{ height: 6, background: "#f1f3ff", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(3, res.pct)}%`, background: res.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Accessed Resources — FR-051: top 10 by download count, past 30 days */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 4px" }}>Most Accessed Resources</h3>
        <p style={{ fontSize: 12, color: "#555f6d", margin: "0 0 16px" }}>Top 10 archive items by download count over the past 30 days</p>

        {mostAccessedLoading ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>Loading…</p>
        ) : !mostAccessed || mostAccessed.length === 0 ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>No downloads recorded in the past 30 days.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(() => {
              const maxDownloads = Math.max(1, ...mostAccessed.map(i => i.download_count));
              return mostAccessed.map((item, i) => (
                <div key={item.item_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#78767d", flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: "#47464c", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                  <div style={{ width: 100, height: 6, background: "#f1f3ff", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ height: "100%", width: `${Math.max(4, (item.download_count / maxDownloads) * 100)}%`, background: "var(--avatar-theme-color)", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#141b2b", width: 28, textAlign: "right", flexShrink: 0 }}>{item.download_count}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Quick action cards - responsive */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { icon: UserCog, label: "User Management", desc: "View, edit, and manage all registered users", tab: "users", color: "var(--avatar-theme-color)" },
          { icon: ClipboardList, label: "Audit Logs", desc: "Browse and export immutable activity records", tab: "audit", color: "#7c3aed" },
          { icon: Settings, label: "System Config", desc: "Manage session, password, and platform settings", tab: "config", color: "#0891b2" },
        ].map(item => (
          <div key={item.tab} onClick={() => setActiveTab(item.tab)} style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: isMobile ? "16px" : "20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <item.icon size={18} color="#fff" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 4px" }}>{item.label}</p>
            <p style={{ fontSize: 12, color: "#555f6d", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Pending access requests */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={14} color="var(--avatar-theme-color)" /> Pending Access Requests
        </h3>
        {!pendingRequests || pendingRequests.length === 0 ? (
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#78767d" }}>
            <Lock size={28} color="#c8c5cd" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No pending access requests</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingRequests.map((req: any) => (
              <div key={req.request_id} style={{ background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "16px 20px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#141b2b" }}>
                    Request by: <span style={{ color: "#0D47A1" }}>{req.user_name}</span> ({req.user_email})
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#47464c" }}>
                    Document: <strong>{req.item_title}</strong>
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "#555f6d", fontStyle: "italic", background: "#fff", padding: "8px 12px", borderRadius: 6, borderLeft: "3px solid #0D47A1" }}>
                    &ldquo;{req.reason}&rdquo;
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}>
                  <button
                    onClick={() => handleApprove(req.request_id)}
                    style={{
                      padding: "8px 14px", borderRadius: 6, border: "none",
                      background: "#141b2b", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 4, flex: isMobile ? 1 : "auto"
                    }}
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => setDenyRequestId(req.request_id)}
                    style={{
                      padding: "8px 14px", borderRadius: 6, border: "none",
                      background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 4, flex: isMobile ? 1 : "auto"
                    }}
                  >
                    <X size={12} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Message Modal */}
      {denyRequestId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <form onSubmit={handleDenySubmit} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "24px 20px" : "28px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#141b2b" }}>Deny Access Request</h3>
              <button type="button" onClick={() => setDenyRequestId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555f6d" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Explanation / Rejection Message</label>
              <textarea
                required
                value={rejectionMessage}
                onChange={e => setRejectionMessage(e.target.value)}
                placeholder="Please enter a reason or rejection message explaining why access is denied..."
                style={{ width: "100%", height: 120, padding: "10px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setDenyRequestId(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#47464c", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={submittingDeny} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {submittingDeny ? "Submitting..." : "Deny Access"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading } = useAdminUsers({
    search,
    role: roleFilter,
    status: statusFilter,
    page,
    limit: 10,
  });

  // Dedicated query, independent of the table's own search/role/page state — the
  // "awaiting approval" banner needs the true pending count, not whatever subset
  // happens to match the current filter/pagination of the users table below.
  const { data: pendingUsersData } = useAdminUsers({ status: "pending_approval", limit: 100 });

  const createMutation  = useCreateAdminUser();
  const updateMutation  = useUpdateAdminUser();
  const deleteMutation  = useDeleteAdminUser();
  const approveMutation = useApproveUser();

  const pendingUsers = pendingUsersData?.items ?? [];

  const handleApproveUser = async (u: any, approved: boolean) => {
    try {
      await approveMutation.mutateAsync({ id: u.user_id, approved });
      toast.success(approved ? `${u.name} approved — email sent.` : `${u.name} rejected.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process approval");
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const department = formData.get("department") as string;

    try {
      await createMutation.mutateAsync({ name, email, password, role, department });
      toast.success("User created successfully");
      setCreateUserModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const department = formData.get("department") as string;
    const membership_status = formData.get("membership_status") as string;

    try {
      await updateMutation.mutateAsync({
        id: editUser.user_id,
        name,
        email,
        role,
        department,
        membership_status,
      });
      toast.success("User updated successfully");
      setEditUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (mode: "hard_delete" | "anonymize") => {
    try {
      await deleteMutation.mutateAsync({ id: deleteModal.user_id, mode });
      toast.success("User deleted successfully");
      setDeleteModal(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const toggleStatus = async (u: any) => {
    const newStatus = u.membership_status === "suspended" ? "active" : "suspended";
    try {
      await updateMutation.mutateAsync({
        id: u.user_id,
        membership_status: newStatus,
      });
      toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const filtered = usersData?.items || [];

  return (
    <div>
      <SectionHeader
        title="User Management"
        desc="View, edit roles, and control account status for all registered users."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}>
            <span style={{ fontSize: 12, color: "#555f6d" }}>{usersData?.total || 0} total users</span>
            <button
              onClick={() => setCreateUserModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: isMobile ? "10px 12px" : "8px 14px",
                borderRadius: 7,
                border: "none",
                background: "var(--avatar-theme-color)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              + Create User
            </button>
          </div>
        }
      />

      {/* ── Pending Approval Banner ── */}
      {pendingUsers.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e", margin: "0 0 10px" }}>
            ⏳ {pendingUsers.length} account{pendingUsers.length > 1 ? "s" : ""} awaiting approval
          </p>
          {pendingUsers.map((u: any) => {
            const targetRole = u.requested_role || u.role;
            return (
            <div key={u.user_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #fde68a", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#141b2b" }}>{u.name}</span>
                <span style={{ fontSize: 12, color: "#555f6d" }}>{u.email}</span>
                {u.department && <span style={{ fontSize: 12, color: "#78767d" }}>· {u.department}</span>}
                <Pill label={targetRole} bg={ROLE_COLORS[targetRole]?.bg ?? "#f1f3ff"} color={ROLE_COLORS[targetRole]?.color ?? "#555f6d"} />
                {u.requested_role && (
                  <span style={{ fontSize: 11, color: "#78767d" }}>(switching from {u.role.replace("_", " ")})</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleApproveUser(u, true)} style={{ padding: "6px 14px", background: "#141b2b", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Approve
                </button>
                <button onClick={() => handleApproveUser(u, false)} style={{ padding: "6px 14px", background: "#fde8e8", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Reject
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Filters - responsive */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : 200, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "9px 12px" }}>
          <Search size={13} color="#78767d" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#141b2b", width: "100%" }} />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#47464c", outline: "none", cursor: "pointer", flex: isMobile ? 1 : undefined, minWidth: isMobile ? "100%" : "auto" }}>
          <option value="all">All Roles</option>
          {["member","student_author","researcher","archivist","librarian","admin"].map(r => (
            <option key={r} value={r}>{r.replace("_"," ")}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#47464c", outline: "none", cursor: "pointer", flex: isMobile ? 1 : undefined, minWidth: isMobile ? "100%" : "auto" }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table/Card layout - responsive */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, overflow: isMobile ? "visible" : "hidden" }}>
        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 2fr 1.1fr 0.9fr 0.9fr 2.3fr", gap: 12, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "12px 20px" }}>
            {["USER","EMAIL","ROLE","STATUS","JOINED","ACTIONS"].map(c => (
              <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px" }}>{c}</div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#78767d" }}>
            <Users size={28} color="#c8c5cd" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No users match your filters</p>
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px" }}>
            {filtered.map((u: any) => (
              <div key={u.user_id} style={{ background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--avatar-theme-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {(u.name || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#141b2b", wordBreak: "break-word" }}>{u.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#78767d" }}>{u.department || "No Department"}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555f6d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill label={u.role} bg={ROLE_COLORS[u.role]?.bg ?? "#f1f3ff"} color={ROLE_COLORS[u.role]?.color ?? "#555f6d"} />
                  <Pill label={u.membership_status} bg={PILL[u.membership_status]?.bg ?? "#f1f3ff"} color={PILL[u.membership_status]?.color ?? "#555f6d"} />
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#78767d" }}>Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  <ActionBtn icon={Pencil} label="Edit" bg="#f0f9ff" color="#0369a1" onClick={() => setEditUser(u)} />
                  <ActionBtn icon={u.membership_status === "suspended" ? UserCheck : Ban} label={u.membership_status === "suspended" ? "Activate" : "Suspend"} bg={u.membership_status === "suspended" ? "#d1fae5" : "#fde8e8"} color={u.membership_status === "suspended" ? "#065f46" : "#c81e1e"} onClick={() => toggleStatus(u)} />
                  <ActionBtn icon={Trash2} label="Delete" bg="#fde8e8" color="#c81e1e" onClick={() => setDeleteModal(u)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filtered.map((u: any, i: number) => (
            <div key={u.user_id} style={{
              display: "grid", gridTemplateColumns: "1.8fr 2fr 1.1fr 0.9fr 0.9fr 2.3fr",
              gap: 12, alignItems: "center", padding: "14px 20px",
              borderBottom: i < filtered.length - 1 ? "1px solid #f1f3ff" : "none",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f9f9ff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--avatar-theme-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {(u.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#141b2b" }}>{u.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#78767d" }}>{u.department || "No Department"}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#555f6d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
              <Pill label={u.role} bg={ROLE_COLORS[u.role]?.bg ?? "#f1f3ff"} color={ROLE_COLORS[u.role]?.color ?? "#555f6d"} />
              <Pill label={u.membership_status} bg={PILL[u.membership_status]?.bg ?? "#f1f3ff"} color={PILL[u.membership_status]?.color ?? "#555f6d"} />
              <p style={{ margin: 0, fontSize: 12, color: "#78767d" }}>{new Date(u.created_at).toLocaleDateString()}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                <ActionBtn icon={Pencil} label="Edit" bg="#f0f9ff" color="#0369a1" onClick={() => setEditUser(u)} />
                <ActionBtn icon={u.membership_status === "suspended" ? UserCheck : Ban} label={u.membership_status === "suspended" ? "Activate" : "Suspend"} bg={u.membership_status === "suspended" ? "#d1fae5" : "#fde8e8"} color={u.membership_status === "suspended" ? "#065f46" : "#c81e1e"} onClick={() => toggleStatus(u)} />
                <ActionBtn icon={Trash2} label="Delete" bg="#fde8e8" color="#c81e1e" onClick={() => setDeleteModal(u)} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "#555f6d", margin: 0 }}>Showing {filtered.length} of {usersData?.total || 0} users</p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={13} />
          </button>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "var(--avatar-theme-color)", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 700 }}>{page}</button>
          <button
            disabled={filtered.length < 10}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer", opacity: filtered.length < 10 ? 0.5 : 1 }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      {createUserModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <form onSubmit={handleCreateUser} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "24px 20px" : "28px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#141b2b" }}>Create New User Account</h3>
              <button type="button" onClick={() => setCreateUserModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555f6d" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Full Name</label>
              <input name="name" required type="text" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Email Address</label>
              <input name="email" required type="email" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Password</label>
              <input name="password" required type="password" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Department</label>
              <input name="department" type="text" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Role</label>
              <select name="role" defaultValue="member" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", background: "#fff" }}>
                {["member","student_author","researcher","archivist","librarian","admin"].map(r => (
                  <option key={r} value={r}>{r.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setCreateUserModal(false)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#47464c", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={createMutation.isPending} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {createMutation.isPending ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <form onSubmit={handleUpdateUser} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "24px 20px" : "28px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#141b2b" }}>Edit User Profile</h3>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555f6d" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Full Name</label>
              <input name="name" required defaultValue={editUser.name} type="text" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Email Address</label>
              <input name="email" required defaultValue={editUser.email} type="email" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Department</label>
              <input name="department" defaultValue={editUser.department} type="text" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Role</label>
              <select name="role" defaultValue={editUser.role} style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", background: "#fff" }}>
                {["member","student_author","researcher","archivist","librarian","admin"].map(r => (
                  <option key={r} value={r}>{r.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Status</label>
              <select name="membership_status" defaultValue={editUser.membership_status} style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", background: "#fff" }}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setEditUser(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#47464c", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "24px 20px" : "28px 32px", width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={18} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#141b2b" }}>Delete User Account</h3>
            </div>
            <p style={{ fontSize: 13, color: "#555f6d", marginBottom: 16, lineHeight: 1.6 }}>
              You are about to delete <strong style={{ color: "#141b2b" }}>{deleteModal.name}</strong>. This action is <strong style={{ color: "#dc2626" }}>irreversible</strong>. Choose a deletion mode:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { mode: "anonymize", label: "Anonymize (GDPR)", desc: "Removes personal data, preserves transaction history", color: "#d97706" },
                { mode: "hard_delete", label: "Hard Delete", desc: "Permanently removes the user record", color: "#dc2626" },
              ].map((opt, oidx) => (
                <label key={opt.mode} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", border: "1px solid #c8c5cd", borderRadius: 8, cursor: "pointer" }}>
                  <input type="radio" name="deleteMode" id={`delmode-${opt.mode}`} defaultChecked={oidx === 0} style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#555f6d" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteModal(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#47464c", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => {
                const isHard = (document.getElementById("delmode-hard_delete") as HTMLInputElement)?.checked;
                handleDeleteUser(isHard ? "hard_delete" : "anonymize");
              }} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Audit Logs ───────────────────────────────────────────────────────────
function AuditTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: auditData, isLoading } = useAdminAuditLogs({
    search,
    action: actionFilter,
    entityType: entityFilter,
    page,
    limit: 10,
  });

  const logs = auditData?.items || [];
  const total = auditData?.total || 0;

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      toast.error("No audit logs available to export");
      return;
    }

    const headers = ["Timestamp", "User ID", "User Name", "Action", "Entity Type", "Entity ID", "Details"];
    const csvRows = [headers.join(",")];

    logs.forEach((log: any) => {
      const row = [
        new Date(log.timestamp).toLocaleString(),
        log.user_id || "System",
        log.user_name || "System",
        log.action,
        log.entity_type,
        log.entity_id || "N/A",
        JSON.stringify(log.details).replace(/"/g, '""')
      ];
      csvRows.push(row.map(val => `"${val}"`).join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported as CSV successfully!");
  };

  return (
    <div>
      <SectionHeader
        title="Audit Log Viewer"
        desc="Immutable, append-only record of all state-changing platform events."
        action={
          <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: "none", background: "var(--theme-gradient-160)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Download size={13} /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "9px 12px" }}>
          <Search size={13} color="#78767d" />
          <input type="text" placeholder="Filter by user ID or name…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#141b2b", width: "100%" }} />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#47464c", outline: "none", cursor: "pointer" }}>
          <option value="all">All Actions</option>
          {["CREATE","UPDATE","DELETE","ACCESS","LOGIN","LOGOUT","DOWNLOAD","STATUS_CHANGE","BACKUP","RESTORE","APPROVE_USER","REJECT_USER"].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#47464c", outline: "none", cursor: "pointer" }}>
          <option value="all">All Entity Types</option>
          {["user","archive_item","backup","backup_schedule","system_config","borrow","fine","catalog_import"].map(t => (
            <option key={t} value={t}>{t.replace(/_/g," ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1.2fr 1.2fr 0.6fr", gap: 12, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "12px 20px" }}>
          {["TIMESTAMP","USER","ACTION","ENTITY TYPE","ENTITY ID","DETAILS"].map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px" }}>{c}</div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#78767d" }}>
            <ClipboardList size={28} color="#c8c5cd" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No audit log entries match your filters</p>
          </div>
        ) : logs.map((log: any, i: number) => {
          const ac = ACTION_COLORS[log.action] ?? { bg: "#f1f3ff", color: "#555f6d" };
          const isExpanded = expanded === log.log_id;
          return (
            <div key={log.log_id}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1.2fr 1.2fr 0.6fr",
                gap: 12, alignItems: "center", padding: "13px 20px",
                borderBottom: "1px solid #f1f3ff", transition: "background 0.1s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f9f9ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <p style={{ margin: 0, fontSize: 12, color: "#47464c", fontFamily: "monospace" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#141b2b" }}>{log.user_name || "System"}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#78767d", fontFamily: "monospace" }}>{log.user_id || "N/A"}</p>
                </div>
                <Pill label={log.action} bg={ac.bg} color={ac.color} />
                <p style={{ margin: 0, fontSize: 12, color: "#555f6d" }}>{(log.entity_type || "").replace("_"," ")}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#78767d", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.entity_id || "N/A"}</p>
                <button onClick={() => setExpanded(isExpanded ? null : log.log_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555f6d", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600 }}>
                  <Eye size={12} /> {isExpanded ? "Hide" : "View"}
                </button>
              </div>
              {isExpanded && (
                <div style={{ padding: "12px 20px 16px", background: "#f9f9ff", borderBottom: "1px solid #c8c5cd" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#555f6d", textTransform: "uppercase", letterSpacing: "0.5px" }}>Details (JSON)</p>
                  <pre style={{ margin: 0, fontSize: 12, color: "#47464c", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 6, padding: "10px 14px", overflow: "auto" }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "#555f6d", margin: 0 }}>Showing {logs.length} of {total} entries</p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer", opacity: page === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={13} />
          </button>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "var(--avatar-theme-color)", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 700 }}>{page}</button>
          <button
            disabled={logs.length < 10}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer", opacity: logs.length < 10 ? 0.5 : 1 }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: System Config ────────────────────────────────────────────────────────
function ConfigTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: configsList, isLoading } = useAdminConfigs();
  const updateMutation = useUpdateAdminConfigs();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (configsList) {
      setConfig(configsList.reduce((acc: any, c: any) => ({ ...acc, [c.key]: c.value }), {}));
    }
  }, [configsList]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(config);
      toast.success("System configuration saved successfully");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error("Failed to save configurations");
    }
  };

  const currentConfigs = configsList || [];

  return (
    <div>
      <SectionHeader title="System Configuration" desc="Manage global platform settings. Changes take effect immediately." />

      {isLoading ? (
        <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton className="h-[60px] w-full" />
          <Skeleton className="h-[60px] w-full" />
          <Skeleton className="h-[60px] w-full" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          {currentConfigs.map((item: any) => (
            <div key={item.key} style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, padding: isMobile ? "14px 16px" : "18px 20px" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {item.key.replace(/_/g, " ")}
              </label>
              <p style={{ fontSize: 12, color: "#78767d", margin: "0 0 10px", lineHeight: 1.5 }}>{item.description}</p>
              {item.value === "true" || item.value === "false" || config[item.key] === "true" || config[item.key] === "false" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, [item.key]: prev[item.key] === "true" ? "false" : "true" }))}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: config[item.key] === "true" ? "var(--avatar-theme-color)" : "#c8c5cd",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: config[item.key] === "true" ? 23 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "#fff",
                      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: config[item.key] === "true" ? "#065f46" : "#555f6d" }}>
                    {config[item.key] === "true" ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={config[item.key] ?? item.value}
                  onChange={e => setConfig(prev => ({ ...prev, [item.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#c8c5cd"; }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
        <button onClick={handleSave} disabled={updateMutation.isPending} style={{ padding: isMobile ? "12px 16px" : "10px 24px", borderRadius: 7, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: isMobile ? "100%" : "auto" }}>
          <Check size={14} /> {saved ? "Saved!" : updateMutation.isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}


// ── Tab: Backups ──────────────────────────────────────────────────────────────
const BACKUP_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: "#d1fae5", color: "#065f46" },
  running:   { bg: "#e8f0fe", color: "#0D47A1" },
  failed:    { bg: "#fde8e8", color: "#c81e1e" },
};

function BackupsTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: backups = [], isLoading } = useBackups();
  const { data: schedule } = useBackupSchedule();
  const generateMutation = useGenerateBackup();
  const downloadMutation = useDownloadBackup();
  const restoreMutation = useRestoreBackup();
  const updateScheduleMutation = useUpdateBackupSchedule();

  const [cronInput, setCronInput] = useState("");
  const [enabledInput, setEnabledInput] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [confirmFilename, setConfirmFilename] = useState("");

  useEffect(() => {
    if (schedule) {
      setCronInput(schedule.cronExpression);
      setEnabledInput(schedule.enabled);
    }
  }, [schedule]);

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleGenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: (record) => {
        if (record.status === "failed") {
          toast.error(`Backup failed: ${record.error_message ?? "unknown error"}`);
        } else {
          toast.success("Backup generated and uploaded to S3 successfully");
        }
      },
      onError: () => toast.error("Failed to trigger backup"),
    });
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await downloadMutation.mutateAsync(id);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed — backup may not be available");
    }
  };

  const handleUpdateSchedule = () => {
    updateScheduleMutation.mutate(
      { cronExpression: cronInput, enabled: enabledInput },
      {
        onSuccess: () => toast.success("Backup schedule updated"),
        onError: () => toast.error("Invalid cron expression or update failed"),
      }
    );
  };

  const handleConfirmRestore = () => {
    if (!restoreTarget) return;
    restoreMutation.mutate(
      { id: restoreTarget.backup_id, confirmFilename },
      {
        onSuccess: () => {
          toast.success(`Restored from "${restoreTarget.filename}"`);
          setRestoreTarget(null);
          setConfirmFilename("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Restore failed");
        },
      }
    );
  };

  return (
    <div>
      <SectionHeader
        title="Backup Management"
        desc="Generate, schedule, and restore database backups stored in S3/MinIO."
        action={
          <button onClick={handleGenerate} disabled={generateMutation.isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 7, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: generateMutation.isPending ? "not-allowed" : "pointer", opacity: generateMutation.isPending ? 0.7 : 1 }}>
            <Database size={14} /> {generateMutation.isPending ? "Generating…" : "Generate Backup Now"}
          </button>
        }
      />

      {/* Schedule config */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color="var(--avatar-theme-color)" /> Backup Schedule
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Cron Expression</label>
            <input type="text" value={cronInput} onChange={e => setCronInput(e.target.value)} placeholder="e.g. 0 9 * * *"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#c8c5cd"; }} />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#78767d" }}>
              {schedule ? `Active: ${schedule.enabled ? schedule.cronExpression : "disabled"}` : "Loading current schedule…"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#47464c", fontWeight: 600 }}>Enabled</span>
            <div
              onClick={() => setEnabledInput(v => !v)}
              style={{ width: 44, height: 24, borderRadius: 12, background: enabledInput ? "var(--avatar-theme-color)" : "#c8c5cd", position: "relative", cursor: "pointer", transition: "background 0.15s" }}
            >
              <span style={{ position: "absolute", top: 3, left: enabledInput ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
            </div>
          </div>
          <button onClick={handleUpdateSchedule} disabled={updateScheduleMutation.isPending} style={{ padding: "9px 16px", borderRadius: 6, border: "none", background: "#141b2b", fontSize: 13, fontWeight: 600, color: "#fff", cursor: updateScheduleMutation.isPending ? "not-allowed" : "pointer", marginBottom: 20, opacity: updateScheduleMutation.isPending ? 0.7 : 1 }}>
            {updateScheduleMutation.isPending ? "Updating…" : "Update Schedule"}
          </button>
        </div>
      </div>

      {/* Backup list */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1fr 1fr", gap: 12, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "12px 20px" }}>
          {["FILENAME","SIZE","CREATED AT","STATUS","ACTIONS"].map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px" }}>{c}</div>
          ))}
        </div>
        {isLoading && (
          <div style={{ padding: 20 }}><Skeleton className="h-[60px] w-full" /></div>
        )}
        {!isLoading && backups.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#78767d" }}>
            No backups yet — click &quot;Generate Backup Now&quot; to create one.
          </div>
        )}
        {backups.map((b, i) => {
          const style = BACKUP_STATUS_STYLE[b.status] ?? { bg: "#f1f3ff", color: "#555f6d" };
          return (
            <div key={b.backup_id} style={{
              display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1fr 1fr",
              gap: 12, alignItems: "center", padding: "14px 20px",
              borderBottom: i < backups.length - 1 ? "1px solid #f1f3ff" : "none",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f9f9ff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Database size={14} color="#78767d" />
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#47464c", fontFamily: "monospace" }}>{b.filename}</p>
                </div>
                {b.status === "failed" && b.error_message && (
                  <p style={{ margin: "3px 0 0 22px", fontSize: 11, color: "#c81e1e" }}>{b.error_message}</p>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#555f6d" }}>{formatBytes(b.size_bytes)}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#555f6d" }}>{new Date(b.created_at).toLocaleString()}</p>
              <Pill label={b.status} bg={style.bg} color={style.color} />
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn icon={Download} label="Download" bg="#f0f9ff" color="#0369a1"
                  onClick={() => b.status === "completed" ? handleDownload(b.backup_id) : toast.error("Backup is not available for download")}
                />
                <ActionBtn icon={RotateCcw} label="Restore" bg="#fef3c7" color="#92400e"
                  onClick={() => b.status === "completed" ? setRestoreTarget(b) : toast.error("Backup is not available for restore")}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Restore confirmation modal */}
      {restoreTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #c8c5cd", padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#141b2b", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} color="#c81e1e" /> Restore Database
            </h3>
            <p style={{ fontSize: 13, color: "#555f6d", margin: "0 0 12px", lineHeight: 1.5 }}>
              This will overwrite the live database with the contents of <strong>{restoreTarget.filename}</strong>. A fresh safety backup will be taken first, but this action cannot be undone quickly. Type the filename below to confirm.
            </p>
            <input
              type="text"
              value={confirmFilename}
              onChange={e => setConfirmFilename(e.target.value)}
              placeholder={restoreTarget.filename}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "monospace" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => { setRestoreTarget(null); setConfirmFilename(""); }} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={handleConfirmRestore}
                disabled={confirmFilename !== restoreTarget.filename || restoreMutation.isPending}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#c81e1e", fontSize: 13, fontWeight: 700, color: "#fff", cursor: (confirmFilename !== restoreTarget.filename || restoreMutation.isPending) ? "not-allowed" : "pointer", opacity: (confirmFilename !== restoreTarget.filename || restoreMutation.isPending) ? 0.5 : 1 }}
              >
                {restoreMutation.isPending ? "Restoring…" : "Restore Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Alerts ───────────────────────────────────────────────────────────────
function AlertsTab({ readAlertIds, onDismiss }: { readAlertIds: string[]; onDismiss: (id: string) => void }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: healthData, isLoading } = useAdminHealth();
  const [slackOpen, setSlackOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [slackHover, setSlackHover] = useState(false);
  const [emailHover, setEmailHover] = useState(false);

  useEffect(() => {
    setSlackWebhook(localStorage.getItem("slack_webhook") || "");
    setEmailRecipient(localStorage.getItem("email_recipient") || "");
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[80px] w-full" />
        <Skeleton className="h-[80px] w-full" />
      </div>
    );
  }

  const systemStatus = healthData?.status || "healthy";
  const services = healthData?.services || { api: "healthy", database: "healthy", s3: "healthy", elasticsearch: "healthy" };
  const rawAlerts = healthData?.alerts || [];

  // Map alerts to handle local dismissals
  const alerts = rawAlerts.map((a: any) => ({
    ...a,
    read: a.read || readAlertIds.includes(a.id),
  }));

  const dismiss = (id: string) => {
    onDismiss(id);
    toast.success("Alert dismissed");
  };

  const ALERT_STYLES: Record<string, { bg: string; border: string; icon: string; color: string }> = {
    error_spike: { bg: "#fef2f2", border: "#fecaca", icon: "#dc2626", color: "#991b1b" },
    downtime:    { bg: "#fef3c7", border: "#fde68a", icon: "#d97706", color: "#92400e" },
    info:        { bg: "#f0f9ff", border: "#bae6fd", icon: "#0369a1", color: "#0c4a6e" },
  };

  const isDegraded = systemStatus !== "healthy";

  return (
    <div>
      <SectionHeader
        title="Infrastructure Alerts"
        desc="System health notifications for downtime and error-rate spikes."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSlackOpen(true)}
              onMouseEnter={() => setSlackHover(true)}
              onMouseLeave={() => setSlackHover(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "9px 15px",
                borderRadius: 8,
                border: "none",
                background: "var(--theme-gradient-160)",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 0.2s ease, transform 0.1s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                opacity: slackHover ? 0.9 : 1,
                transform: slackHover ? "translateY(-1px)" : "none"
              }}
            >
              <Slack size={13} /> Configure Slack
            </button>
            <button
              onClick={() => setEmailOpen(true)}
              onMouseEnter={() => setEmailHover(true)}
              onMouseLeave={() => setEmailHover(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "9px 15px",
                borderRadius: 8,
                border: "none",
                background: "var(--theme-gradient-160)",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 0.2s ease, transform 0.1s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                opacity: emailHover ? 0.9 : 1,
                transform: emailHover ? "translateY(-1px)" : "none"
              }}
            >
              <Mail size={13} /> Configure Email
            </button>
          </div>
        }
      />

      {/* Slack Webhook Modal */}
      {slackOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #c8c5cd", padding: isMobile ? "24px 20px" : "24px", width: "100%", maxWidth: 450, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", textAlign: "left", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#141b2b", margin: "0 0 8px" }}>Configure Slack Notifications</h3>
            <p style={{ fontSize: 13, color: "#555f6d", margin: "0 0 20px", lineHeight: 1.4 }}>Set the Slack Webhook URL to stream real-time platform system health alerts directly to your channels.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem("slack_webhook", slackWebhook);
              setSlackOpen(false);
              toast.success("Slack Webhook URL saved successfully!");
            }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#47464c", marginBottom: 6 }}>Slack Webhook URL</label>
              <input
                required
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", marginBottom: 20 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setSlackOpen(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Save Webhook</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Recipient Modal */}
      {emailOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #c8c5cd", padding: isMobile ? "24px 20px" : "24px", width: "100%", maxWidth: 450, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", textAlign: "left", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#141b2b", margin: "0 0 8px" }}>Configure Email Alerts</h3>
            <p style={{ fontSize: 13, color: "#555f6d", margin: "0 0 20px", lineHeight: 1.4 }}>Set the administrative email recipient address for high-priority infrastructure downtime alerts.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem("email_recipient", emailRecipient);
              setEmailOpen(false);
              toast.success("Alert email recipient configured successfully!");
            }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#47464c", marginBottom: 6 }}>Administrator Email Address</label>
              <input
                required
                type="email"
                placeholder="admin@dkp-institutional.org"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", marginBottom: 20 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setEmailOpen(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Save Config</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health status bar */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: isDegraded ? "#dc2626" : "#16a34a", boxShadow: isDegraded ? "0 0 0 3px #fecaca" : "0 0 0 3px #d1fae5" }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#141b2b" }}>
            {isDegraded ? "System Degraded" : "System Operational"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#555f6d" }}>
            {isDegraded ? "One or more core components are failing" : "All services healthy · Real-time monitoring active"}
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {[
            { label: "API", status: services.api },
            { label: "Database", status: services.database },
            { label: "S3 Storage", status: services.s3 },
            { label: "Elasticsearch", status: services.elasticsearch },
          ].map(s => {
            const ok = s.status === "healthy";
            return (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? "#16a34a" : "#dc2626", margin: "0 auto 4px" }} />
                <p style={{ margin: 0, fontSize: 11, color: "#555f6d", fontWeight: 600 }}>{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((alert: any) => {
          const style = ALERT_STYLES[alert.type] ?? ALERT_STYLES.info;
          const IconComp = alert.type === "error_spike" ? Zap : alert.type === "downtime" ? Server : Bell;
          return (
            <div key={alert.id} style={{
              background: alert.read ? "#f9f9ff" : style.bg,
              border: `1px solid ${alert.read ? "#c8c5cd" : style.border}`,
              borderRadius: 10, padding: "16px 20px",
              display: "flex", alignItems: "flex-start", gap: 14,
              opacity: alert.read ? 0.6 : 1, transition: "opacity 0.2s",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: alert.read ? "#c8c5cd" : style.bg, border: `1px solid ${alert.read ? "#c8c5cd" : style.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconComp size={16} color={alert.read ? "#78767d" : style.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: alert.read ? "#555f6d" : style.color }}>{alert.title}</p>
                  {!alert.read && <span style={{ fontSize: 10, fontWeight: 700, background: style.icon, color: "#fff", padding: "2px 6px", borderRadius: 4 }}>NEW</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#555f6d", lineHeight: 1.5 }}>{alert.message}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#78767d" }}>{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
              {!alert.read && (
                <button onClick={() => dismiss(alert.id)} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #c8c5cd", background: "#fff", fontSize: 11, fontWeight: 600, color: "#47464c", cursor: "pointer", flexShrink: 0 }}>
                  Dismiss
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Broadcast Announcements ──────────────────────────────────────────────
const ANNOUNCEMENT_ROLES = ["member","student_author","researcher","archivist","librarian","admin"];

function AnnouncementsTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: announcements = [], isLoading: historyLoading } = useAnnouncements();
  const broadcast = useBroadcastAnnouncement();

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message body are required");
      return;
    }
    try {
      await broadcast.mutateAsync({
        title, body,
        target_role: targetRole === "all" ? undefined : targetRole,
      });
      toast.success(editingId ? "Announcement resent successfully!" : "Announcement broadcasted successfully to all target users!");
      setTitle("");
      setBody("");
      setTargetRole("all");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to broadcast announcement");
    }
  };

  const handleEdit = (a: Announcement) => {
    setTitle(a.title);
    setBody(a.body);
    setTargetRole(a.target_role ?? "all");
    setEditingId(a.announcement_id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setTitle(""); setBody(""); setTargetRole("all"); setEditingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div ref={formRef} style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "28px 32px" }}>
        <SectionHeader
          title={editingId ? "Edit & Resend Announcement" : "Broadcast Announcement"}
          desc="Send a platform-wide alert or targeted notification via email and in-app message."
        />
        <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Target Audience</label>
            <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", background: "#fff" }}>
              <option value="all">All Registered Users</option>
              {ANNOUNCEMENT_ROLES.map(r => (
                <option key={r} value={r}>{r.replace("_"," ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Announcement Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Scheduled System Upgrade" style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Message Body</label>
            <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} required placeholder="Write your message here..." style={{ width: "100%", padding: "9px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={{ padding: "10px 20px", borderRadius: 7, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={broadcast.isPending} style={{ padding: "10px 24px", borderRadius: 7, border: "none", background: "var(--theme-gradient-160)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={14} /> {broadcast.isPending ? "Sending..." : editingId ? "Resend Notice" : "Broadcast Notice"}
            </button>
          </div>
        </form>
      </div>

      {/* Sent announcement history */}
      <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f3ff" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: 0 }}>Sent Announcements</h3>
        </div>
        {historyLoading ? (
          <div style={{ padding: 20 }}><Skeleton className="h-[80px] w-full" /></div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#78767d" }}>
            No announcements sent yet.
          </div>
        ) : (
          announcements.map((a, i) => (
            <div key={a.announcement_id} style={{ padding: "16px 24px", borderBottom: i < announcements.length - 1 ? "1px solid #f9f9ff" : "none", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#141b2b", margin: 0 }}>{a.title}</p>
                  <Pill label={a.target_role ?? "all"} bg="#f0f9ff" color="#0369a1" />
                </div>
                <p style={{ fontSize: 12.5, color: "#555f6d", margin: "0 0 6px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{a.body}</p>
                <p style={{ fontSize: 11, color: "#78767d", margin: 0 }}>
                  Sent {new Date(a.created_at).toLocaleString()}{a.created_by_name ? ` by ${a.created_by_name}` : ""}
                </p>
              </div>
              <ActionBtn icon={Pencil} label="Edit & Resend" bg="#f1f3ff" color="#47464c" onClick={() => handleEdit(a)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tab: Analytics (FR-050/051/052/053/054) ─────────────────────────────────
function AnalyticsTab() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: usage, isLoading: usageLoading } = useUsageAnalytics(days);
  const { data: engagement, isLoading: engagementLoading } = useEngagementAnalytics(days);
  const { data: mostAccessed, isLoading: mostAccessedLoading } = useMostAccessedResources();
  const { data: search, isLoading: searchLoading } = useSearchAnalytics();

  const handleExport = async (metric: "usage" | "most-accessed" | "engagement" | "search") => {
    setExporting(metric);
    try {
      await exportAnalyticsCsv(metric, days);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  const Card = ({ title, desc, metric, children }: { title: string; desc: string; metric: "usage" | "most-accessed" | "engagement" | "search"; children: React.ReactNode }) => (
    <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4, gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 12, color: "#555f6d", margin: "2px 0 0" }}>{desc}</p>
        </div>
        <button
          onClick={() => handleExport(metric)}
          disabled={exporting === metric}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, fontWeight: 600, color: "#47464c", cursor: exporting === metric ? "wait" : "pointer", flexShrink: 0 }}
        >
          <Download size={12} /> CSV
        </button>
      </div>
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Analytics"
        desc="Platform-wide usage statistics, engagement metrics, and search insights."
        action={
          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #c8c5cd", fontSize: 13, fontWeight: 600, color: "#47464c", background: "#fff", cursor: "pointer" }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {/* Engagement stat row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Active Users" value={engagementLoading ? "—" : (engagement?.active_users ?? 0).toLocaleString()} sub={`logged in, last ${days}d`} icon={Users} />
        <StatCard label="New Registrations" value={engagementLoading ? "—" : (engagement?.new_registrations ?? 0).toLocaleString()} sub={`signed up, last ${days}d`} icon={UserCheck} />
        <StatCard label="Returning Rate" value={engagementLoading ? "—" : `${engagement?.returning_rate ?? 0}%`} sub="of active users" icon={RotateCcw} />
      </div>

      {/* Usage time-series */}
      <Card title="Usage Over Time" desc={`Daily uploads, downloads, and searches — last ${days} days`} metric="usage">
        {usageLoading ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>Loading…</p>
        ) : (
          (() => {
            const dates = [...new Set([
              ...(usage?.uploads ?? []).map(r => r.date),
              ...(usage?.downloads ?? []).map(r => r.date),
              ...(usage?.searches ?? []).map(r => r.date),
            ])].sort();
            if (dates.length === 0) return <p style={{ fontSize: 12, color: "#78767d" }}>No activity recorded in this window.</p>;
            const uploadsMap = new Map((usage?.uploads ?? []).map(r => [r.date, r.count]));
            const downloadsMap = new Map((usage?.downloads ?? []).map(r => [r.date, r.count]));
            const searchesMap = new Map((usage?.searches ?? []).map(r => [r.date, r.count]));
            const maxValue = Math.max(1, ...dates.map(d => Math.max(uploadsMap.get(d) ?? 0, downloadsMap.get(d) ?? 0, searchesMap.get(d) ?? 0)));
            return (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 4 : 8, height: 140, overflowX: "auto", paddingBottom: 8 }}>
                  {dates.map(date => (
                    <div key={date} title={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, minWidth: 28 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 110 }}>
                        <div title={`Uploads: ${uploadsMap.get(date) ?? 0}`} style={{ width: 6, height: `${Math.max(2, ((uploadsMap.get(date) ?? 0) / maxValue) * 100)}%`, background: "#0284c7", borderRadius: "2px 2px 0 0" }} />
                        <div title={`Downloads: ${downloadsMap.get(date) ?? 0}`} style={{ width: 6, height: `${Math.max(2, ((downloadsMap.get(date) ?? 0) / maxValue) * 100)}%`, background: "var(--avatar-theme-color)", borderRadius: "2px 2px 0 0" }} />
                        <div title={`Searches: ${searchesMap.get(date) ?? 0}`} style={{ width: 6, height: `${Math.max(2, ((searchesMap.get(date) ?? 0) / maxValue) * 100)}%`, background: "#16a34a", borderRadius: "2px 2px 0 0" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#78767d", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{date.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {[["Uploads", "#0284c7"], ["Downloads", "var(--avatar-theme-color)"], ["Searches", "#16a34a"]].map(([label, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ fontSize: 11, color: "#555f6d", fontWeight: 600 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()
        )}
      </Card>

      {/* Most accessed */}
      <Card title="Most Accessed Resources" desc="Top 10 archive items by download count, past 30 days" metric="most-accessed">
        {mostAccessedLoading ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>Loading…</p>
        ) : !mostAccessed || mostAccessed.length === 0 ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>No downloads recorded in the past 30 days.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(() => {
              const maxDownloads = Math.max(1, ...mostAccessed.map(i => i.download_count));
              return mostAccessed.map((item, i) => (
                <div key={item.item_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 18, fontSize: 11, fontWeight: 700, color: "#78767d", flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: "#47464c", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                  <div style={{ width: 100, height: 6, background: "#f1f3ff", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                    <div style={{ height: "100%", width: `${Math.max(4, (item.download_count / maxDownloads) * 100)}%`, background: "var(--avatar-theme-color)", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#141b2b", width: 28, textAlign: "right", flexShrink: 0 }}>{item.download_count}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </Card>

      {/* Search analytics */}
      <Card title="Search Analytics" desc="Top search terms and zero-result queries, by language" metric="search">
        {searchLoading ? (
          <p style={{ fontSize: 12, color: "#78767d" }}>Loading…</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#555f6d" }}>Bangla queries:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#141b2b" }}>{search?.language_breakdown.bangla ?? 0}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#555f6d" }}>English queries:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#141b2b" }}>{search?.language_breakdown.english ?? 0}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#78767d", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Top Search Terms</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(search?.top_queries ?? []).slice(0, 10).map(q => (
                    <div key={q.query_text} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: "#47464c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.query_text} {q.is_bangla && <span style={{ fontSize: 10, color: "#78767d" }}>(bn)</span>}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#555f6d", flexShrink: 0 }}>{q.search_count}</span>
                    </div>
                  ))}
                  {(!search?.top_queries || search.top_queries.length === 0) && <p style={{ fontSize: 12, color: "#78767d" }}>No searches yet.</p>}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#78767d", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Zero-Result Queries</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(search?.zero_result_queries ?? []).slice(0, 10).map(q => (
                    <div key={q.query_text} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: "#47464c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.query_text} {q.is_bangla && <span style={{ fontSize: 10, color: "#78767d" }}>(bn)</span>}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>{q.search_count}</span>
                    </div>
                  ))}
                  {(!search?.zero_result_queries || search.zero_result_queries.length === 0) && <p style={{ fontSize: 12, color: "#78767d" }}>None — every search returned results.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Engagement export (no dedicated chart, just export access) */}
      <Card title="Engagement Data" desc="Active users, new registrations, and returning-user counts" metric="engagement">
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#141b2b", margin: 0 }}>{engagement?.active_users ?? 0}</p>
            <p style={{ fontSize: 11, color: "#78767d", margin: "2px 0 0" }}>Active users</p>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#141b2b", margin: 0 }}>{engagement?.new_registrations ?? 0}</p>
            <p style={{ fontSize: 11, color: "#78767d", margin: "2px 0 0" }}>New registrations</p>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#141b2b", margin: 0 }}>{engagement?.returning_users ?? 0}</p>
            <p style={{ fontSize: 11, color: "#78767d", margin: "2px 0 0" }}>Returning users</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ADMIN_TABS: AdminTab[] = ["overview", "users", "audit", "config", "backups", "alerts", "announcements", "analytics"];

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const requestedTab = searchParams.get("tab");
  const initialTab: AdminTab = ADMIN_TABS.includes(requestedTab as AdminTab) ? (requestedTab as AdminTab) : "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Non-admin state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // "student_author" submits showcase projects, not a library-borrowing role — it
  // gets its own branch below rather than sharing the borrow/hold library UI.
  const isLibraryStudent = false;
  const isStudentAuthor = user?.role === "student_author";
  const isStudent = isLibraryStudent || isStudentAuthor;
  const memberId = user?.user_id ?? "";

  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  // Shares the same query cache/interval as AlertsTab's own useAdminHealth() call —
  // drives the real unread count on the "Alerts" tab badge instead of MOCK_ALERTS.
  const { data: healthDataForBadge } = useAdminHealth();
  // Dismissals are persisted here (not inside AlertsTab) so the badge count reflects
  // them immediately and they survive switching tabs or reloading the page — alert
  // ids (e.g. "alert-db", "alert-backup-<id>") are stable across health-check polls.
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("dismissed_alert_ids") || "[]");
      if (Array.isArray(stored)) setReadAlertIds(stored);
    } catch { /* ignore malformed storage */ }
  }, []);
  const dismissAlert = (id: string) => {
    setReadAlertIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem("dismissed_alert_ids", JSON.stringify(next));
      return next;
    });
  };
  const unreadAlertCount = (healthDataForBadge?.alerts ?? []).filter((a: any) => !a.read && !readAlertIds.includes(a.id)).length;
  const docParams = { page: currentPage, limit: 10, search: searchQuery, status: filterStatus !== "all" ? filterStatus : undefined };
  // Each documents endpoint is role-scoped on the backend — only fetch the one this role may call
  const { data: catalogDocsData, isLoading: catalogDocsLoading } = useCatalogDocuments(docParams, ["librarian", "admin"].includes(user?.role ?? ""));
  const { data: researchSubmissionsData, isLoading: researchLoading } = useResearcherSubmissions(docParams, user?.role === "researcher");
  const { data: archiveDocsData, isLoading: archiveLoading } = useArchiveDocuments(docParams, ["librarian", "admin", "archivist"].includes(user?.role ?? ""));
  const { data: borrowHistory, isLoading: borrowLoading } = useBorrowingHistory(isLibraryStudent ? memberId : "");
  const { data: memberHolds, isLoading: holdsLoading } = useMemberHolds(isLibraryStudent ? memberId : "");
  const { data: finesData, isLoading: finesLoading } = useMemberFines(isLibraryStudent ? memberId : "");
  const { data: mySubmissions, isLoading: submissionsLoading } = useShowcaseGallery(
    { submitted_by: memberId, limit: 50 }, isStudentAuthor && !!memberId
  );
  const isArchivistOrAdmin = ["archivist", "admin"].includes(user?.role ?? "");
  const { data: pendingRequests, refetch: refetchRequests } = usePendingAccessRequests();
  const { mutateAsync: reviewRequest } = useReviewAccessRequest();
  const [denyRequestId, setDenyRequestId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [submittingDeny, setSubmittingDeny] = useState(false);

  const handleDenySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denyRequestId) return;
    setSubmittingDeny(true);
    try {
      await reviewRequest({ requestId: denyRequestId, status: "denied", rejection_message: rejectionMessage });
      toast.success("Access request denied");
      setDenyRequestId(null);
      setRejectionMessage("");
      refetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to deny access request");
    } finally {
      setSubmittingDeny(false);
    }
  };

  const combinedItems: any[] = [];
  if (borrowHistory) combinedItems.push(...borrowHistory);
  if (memberHolds) combinedItems.push(...memberHolds);
  combinedItems.sort((a: any, b: any) => new Date(b.request_date || b.issue_date || b.created_at).getTime() - new Date(a.request_date || a.issue_date || a.created_at).getTime());

  const filteredCombinedItems = combinedItems.filter((item: any) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title?.toLowerCase().includes(q) || (Array.isArray(item.authors) ? item.authors.join(", ").toLowerCase().includes(q) : false) || item.isbn?.toLowerCase().includes(q);
  });

  const activeLoansCount = borrowHistory?.filter((t: any) => t.status === "active" || t.status === "overdue").length ?? 0;
  const activeHoldsCount = memberHolds?.filter((h: any) => h.status === "pending" || h.status === "available").length ?? 0;

  const documentsData = user?.role === "researcher" ? researchSubmissionsData : user?.role === "archivist" ? archiveDocsData : catalogDocsData;
  const docsLoading = isLibraryStudent ? (borrowLoading || holdsLoading || finesLoading)
    : isStudentAuthor ? submissionsLoading
    : (user?.role === "researcher" ? researchLoading : user?.role === "archivist" ? archiveLoading : catalogDocsLoading);

  // ── Move all hooks to top before any conditional logic ──
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role === "librarian") { router.push("/librarian"); return; }
  }, [isAuthenticated, _hasHydrated, user, router]);

  if (!_hasHydrated || !isAuthenticated || user?.role === "librarian") return null;

  // ── ADMIN: full tabbed panel ──────────────────────────────────────────────
  if (user?.role === "admin") {
    const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "users",    label: "Users",    icon: Users },
      { id: "analytics", label: "Analytics", icon: Activity },
      { id: "audit",    label: "Audit Logs", icon: ClipboardList },
      { id: "config",   label: "System Config", icon: Settings },
      { id: "backups",  label: "Backups",  icon: Database },
      { id: "alerts",   label: "Alerts",   icon: Bell },
      { id: "announcements", label: "Announcements", icon: Zap },
    ];

    return (
      <AppLayout>
        <div style={{ background: "#f9f9ff", minHeight: "100%" }}>

          {/* Hero banner */}
          <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f1f3ff 60%, #f1f3ff 100%)", borderBottom: "1px solid #c8c5cd", padding: isMobile ? "24px 18px 20px" : "32px 40px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 12%, #fff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={19} color="var(--avatar-theme-color, #1a1a2e)" />
              </div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", letterSpacing: "-0.03em", margin: 0 }}>
                Administration
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "#78767d", margin: 0, paddingLeft: 48 }}>
              Monitor platform activity, manage users &amp; configure system settings.
            </p>
          </div>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "24px 40px", maxWidth: isMobile ? "100%" : "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

          {/* Tab bar - scrollable on mobile */}
          <div style={{ display: "flex", gap: isMobile ? 0 : 2, borderBottom: "2px solid #c8c5cd", marginBottom: isMobile ? 20 : 28, overflowX: isMobile ? "auto" : "visible", overflowY: "hidden", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 4 : 6,
                  padding: isMobile ? "8px 10px" : "10px 16px", border: "none", background: "transparent",
                  fontSize: isMobile ? 12 : 13, fontWeight: active ? 700 : 500,
                  color: active ? "var(--avatar-theme-color)" : "#555f6d",
                  cursor: "pointer", borderBottom: active ? "2px solid var(--avatar-theme-color)" : "2px solid transparent",
                  marginBottom: -2, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#47464c"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#555f6d"; }}
                >
                  <tab.icon size={isMobile ? 12 : 14} />
                  {!isMobile && tab.label}
                  {tab.id === "alerts" && unreadAlertCount > 0 && (
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && <OverviewTab adminStats={adminStats} statsLoading={statsLoading} setActiveTab={setActiveTab} />}
          {activeTab === "users"    && <UsersTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "audit"    && <AuditTab />}
          {activeTab === "config"   && <ConfigTab />}
          {activeTab === "backups"  && <BackupsTab />}
          {activeTab === "alerts"   && <AlertsTab readAlertIds={readAlertIds} onDismiss={dismissAlert} />}
          {activeTab === "announcements" && <AnnouncementsTab />}
        </div>
        </div>
      </AppLayout>
    );
  }

  // ── NON-ADMIN: original unchanged layout ─────────────────────────────────
  const roleTitle = isLibraryStudent ? "Student Portal" : ({
    researcher: "My Submissions", member: "Member Dashboard",
    student_author: "Student Submissions",
    archivist: "Archive Management",
  } as Record<string, string>)[user?.role ?? ""] || "Admin Panel";

  const roleDescription = isLibraryStudent ? "View your borrowed books, active reservations, loan durations, and pending fines." : ({
    researcher: "View and manage your research submissions under review.",
    member: "Manage your contributions and submissions.",
    student_author: "Submit and track your academic and student showcase projects.",
    archivist: "Oversee digital archives and preservation tasks.",
  } as Record<string, string>)[user?.role ?? ""] || "Admin panel for platform management";

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: ["archive"] });
    queryClient.invalidateQueries({ queryKey: ["showcase"] });
    toast.success("Data refreshed");
  };

  const roleIcon = isLibraryStudent ? BookOpen : isStudentAuthor ? GraduationCap : user?.role === "researcher" ? FlaskConical : user?.role === "archivist" ? Archive : UserCog;
  const RoleIcon = roleIcon;

  return (
    <AppLayout>
      <div style={{ background: "#f9f9ff", minHeight: "100%" }}>

        {/* Hero banner */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f1f3ff 60%, #f1f3ff 100%)",
          borderBottom: "1px solid #c8c5cd",
          padding: isMobile ? "24px 18px 20px" : "32px 40px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RoleIcon size={19} color="var(--avatar-theme-color, #6366f1)" />
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em", margin: 0 }}>
              {roleTitle}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#78767d", margin: 0, paddingLeft: 48 }}>
            {roleDescription}
          </p>
        </div>

        <div style={{ padding: isMobile ? "16px" : isTablet ? "20px 24px" : "28px 32px" }}>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : user?.role === "researcher" ? "repeat(1, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 20 : 28 }}>
          {isLibraryStudent ? (
            <>
              <StatCard label="Borrowed Books" value={docsLoading ? "—" : activeLoansCount} sub="currently borrowed" icon={BookOpen} />
              <StatCard label="Reserved Books" value={docsLoading ? "—" : activeHoldsCount} sub="active holds / reservations" icon={HardDrive} />
              <StatCard label="Total Fines" value={docsLoading ? "—" : `${finesData?.total_pending ?? 0} TK`} sub="flat 100 TK fine for overdue books" icon={AlertCircle} accent={(finesData?.total_pending ?? 0) > 0 ? "#dc2626" : "var(--avatar-theme-color)"} />
            </>
          ) : isStudentAuthor ? (
            <>
              <StatCard label="Total Submissions" value={docsLoading ? "—" : mySubmissions?.items?.length ?? 0} sub="projects submitted" icon={GraduationCap} />
              <StatCard
                label="Pending Review"
                value={docsLoading ? "—" : (mySubmissions?.items ?? []).filter((p: any) => p.status === "pending_review" || p.status === "changes_requested").length}
                sub="awaiting advisor decision" icon={AlertCircle}
              />
              <StatCard
                label="Published"
                value={docsLoading ? "—" : (mySubmissions?.items ?? []).filter((p: any) => p.status === "published").length}
                sub="live on the showcase" icon={ClipboardList}
              />
            </>
          ) : user?.role === "researcher" ? (
            <StatCard label="My Submissions Under Review" value={statsLoading ? "—" : adminStats?.pendingReview ?? 0} sub={adminStats?.pendingReview ? "awaiting decision" : "all approved"} icon={AlertCircle} accent="#dc2626" />
          ) : (
            <>
              <StatCard label="Total Documents" value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()} sub="Archive & Library combined" icon={FileText} />
              <StatCard label="Active Users" value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()} sub="online this month" icon={Users} />
              <StatCard label="Storage Used" value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 0}%`} sub="of total capacity" icon={HardDrive} />
            </>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: 20, justifyContent: "space-between", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "10px 12px" }}>
            <Search size={14} color="#78767d" />
            <input type="text" placeholder={isMobile ? "Search..." : "Search by title, author, or DOI..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#141b2b", width: "100%" }} />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ padding: "10px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, fontSize: 16, fontWeight: 600, color: "#47464c", outline: "none", cursor: "pointer", minWidth: isMobile ? "auto" : "140px" }}>
            <option value="all">All Statuses</option>
            {isLibraryStudent ? (<><option value="active">Active Borrowed</option><option value="overdue">Overdue Books</option><option value="returned">Returned Books</option><option value="pending">Pending Hold</option><option value="available">Available Hold</option></>) : (<><option value="published">Published</option><option value="pending_review">Pending Review</option><option value="changes_requested">Changes Requested</option><option value="draft">Draft</option></>)}
          </select>
          <button onClick={() => { setFilterStatus("all"); setSearchQuery(""); setCurrentPage(1); }}
            style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 6, padding: isMobile ? "10px 8px" : "10px 14px", background: (filterStatus !== "all" || searchQuery) ? "var(--avatar-theme-color)" : "#fff", border: (filterStatus !== "all" || searchQuery) ? "none" : "1px solid #c8c5cd", borderRadius: 8, cursor: "pointer", fontSize: isMobile ? 11 : 13, fontWeight: 600, color: (filterStatus !== "all" || searchQuery) ? "#fff" : "#555f6d", whiteSpace: "nowrap" }}>
            <Filter size={14} />{!isMobile && ((filterStatus !== "all" || searchQuery) ? "Clear" : "Filter")}
          </button>
          <button onClick={handleRefresh} style={{ width: isMobile ? 36 : "auto", height: 36, padding: isMobile ? 0 : "10px 12px", background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 0 : 6, fontSize: isMobile ? 11 : 13, fontWeight: isMobile ? 600 : 500, color: "#555f6d" }}>
            <RefreshCw size={14} color="#555f6d" />
            {!isMobile && "Refresh"}
          </button>
        </div>

        {/* Access Requests (archivist) */}
        {isArchivistOrAdmin && pendingRequests && pendingRequests.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #c8c5cd", display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={15} color="#555f6d" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: 0 }}>Restricted Document Access Requests</h3>
              <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: PILL.pending.bg, color: PILL.pending.color }}>{pendingRequests.length}</span>
            </div>
            <div>
              {pendingRequests.map((req: any, i: number) => (
                <div key={req.request_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i === pendingRequests.length - 1 ? "none" : "1px solid #f1f3ff" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: ROLE_COLORS.member.bg, color: ROLE_COLORS.member.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(req.user_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#141b2b" }}>
                        {req.user_name} <span style={{ fontWeight: 400, color: "#78767d" }}>({req.user_email})</span>
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#555f6d" }}>
                        requested access to <span style={{ fontWeight: 600, color: "#47464c" }}>{req.item_title}</span>
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#555f6d", fontStyle: "italic", background: "#f9f9ff", padding: "6px 10px", borderRadius: 6, border: "1px solid #f1f3ff" }}>
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={async () => { try { await reviewRequest({ requestId: req.request_id, status: "approved" }); toast.success("Approved!"); refetchRequests(); } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to approve"); } }}
                      style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: "#141b2b", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => setDenyRequestId(req.request_id)}
                      style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: "#fde8e8", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <X size={12} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection Message Modal */}
        {denyRequestId && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <form onSubmit={handleDenySubmit} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? "24px 20px" : "28px 32px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#141b2b" }}>Deny Access Request</h3>
                <button type="button" onClick={() => setDenyRequestId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555f6d" }}><X size={18} /></button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#47464c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Explanation / Rejection Message</label>
                <textarea
                  required
                  value={rejectionMessage}
                  onChange={e => setRejectionMessage(e.target.value)}
                  placeholder="Please enter a reason or rejection message explaining why access is denied..."
                  style={{ width: "100%", height: 120, padding: "10px 12px", border: "1px solid #c8c5cd", borderRadius: 6, fontSize: 16, color: "#141b2b", outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setDenyRequestId(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 13, fontWeight: 600, color: "#47464c", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={submittingDeny} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  {submittingDeny ? "Submitting..." : "Deny Access"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk metadata modification panel for Archivist */}
        {user?.role === "archivist" && selectedIds.length > 0 && (
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 8, padding: "12px 16px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>
              Selected {selectedIds.length} item(s)
            </span>
            <select
              id="bulk-category"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #c8c5cd", fontSize: 16, outline: "none", color: "#141b2b" }}
            >
              <option value="">-- Change Category --</option>
              <option value="General">General</option>
              <option value="Research">Research</option>
              <option value="Report">Report</option>
              <option value="Thesis">Thesis</option>
            </select>
            <select
              id="bulk-access"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #c8c5cd", fontSize: 16, outline: "none", color: "#141b2b" }}
            >
              <option value="">-- Change Access Tier --</option>
              <option value="public">Public</option>
              <option value="member">Member-only</option>
              <option value="restricted">Restricted</option>
            </select>
            <button
              onClick={async () => {
                const categorySelect = document.getElementById("bulk-category") as HTMLSelectElement;
                const accessSelect = document.getElementById("bulk-access") as HTMLSelectElement;
                const category = categorySelect?.value || undefined;
                const access_tier = accessSelect?.value || undefined;
                if (!category && !access_tier) {
                  toast.error("Please select a category or access tier to update");
                  return;
                }
                try {
                  const api = (await import("@/lib/api")).default;
                  await api.patch("/archive/bulk-metadata", { ids: selectedIds, category, access_tier });
                  toast.success("Bulk metadata updated successfully!");
                  setSelectedIds([]);
                  handleRefresh();
                } catch {
                  toast.error("Failed to update bulk metadata");
                }
              }}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                background: "var(--avatar-theme-color, #6366f1)", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              Apply Bulk Changes
            </button>
          </div>
        )}

        {/* Student policy notice */}
        {isLibraryStudent && (
          <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fcd34d", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#92400e", fontWeight: 500, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>Library Policy Notice:</span> Books must be returned within the designated time duration. A flat fine of <span style={{ fontWeight: 700, color: "#b45309" }}>100 TK</span> will be charged per overdue book.
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8, overflow: "hidden" }}>
          {docsLoading ? (
            <div style={{ padding: "32px 24px" }}>{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 mb-3" />)}</div>
          ) : isStudentAuthor ? (
            !mySubmissions?.items || mySubmissions.items.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#555f6d" }}>
                <p>No showcase submissions yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px" }}>
                {mySubmissions.items
                  .filter((p: any) => filterStatus === "all" || p.status === filterStatus)
                  .filter((p: any) => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((project: any) => {
                    const statusStyle = PILL[project.status] || PILL.draft;
                    return (
                      <div key={project.project_id} style={{ background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "#141b2b", fontSize: 14 }}>{project.title}</p>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555f6d" }}>
                              {project.department} &middot; {project.semester} &middot; Advisor: {project.advisor_name ?? "Unassigned"}
                            </p>
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: statusStyle.bg, color: statusStyle.color, whiteSpace: "nowrap" }}>
                            {project.status?.replace("_", " ")}
                          </span>
                        </div>
                        {project.status === "changes_requested" && project.advisor_comments && (
                          <div style={{ fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, padding: "8px 10px" }}>
                            <strong>Advisor feedback:</strong> {project.advisor_comments}
                          </div>
                        )}
                        <a href={`/showcase/${project.project_id}`} style={{ fontSize: 12, color: "var(--avatar-theme-color, #0D47A1)", fontWeight: 600, textDecoration: "none" }}>
                          View submission →
                        </a>
                      </div>
                    );
                  })}
              </div>
            )
          ) : isLibraryStudent ? (
            !filteredCombinedItems || filteredCombinedItems.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#555f6d" }}><p>No borrowed or reserved books found</p></div>
            ) : isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px" }}>
                {filteredCombinedItems.map((item: any) => {
                  const isHold = "hold_id" in item;
                  let pillStyle = { bg: "#f1f3ff", color: "#555f6d" };
                  if (item.status === "active") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  else if (item.status === "overdue") pillStyle = { bg: "#fde8e8", color: "#c81e1e" };
                  else if (item.status === "pending") pillStyle = { bg: "#e8f0fe", color: "#0D47A1" };
                  else if (item.status === "available") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  const durationText = isHold ? `Reserved on ${new Date(item.request_date).toLocaleDateString()}` : item.status === "returned" && item.return_date ? `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Returned: ${new Date(item.return_date).toLocaleDateString()}` : `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Due: ${new Date(item.due_date).toLocaleDateString()}`;
                  return (
                    <div key={isHold ? item.hold_id : item.transaction_id} style={{ background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#141b2b", fontSize: 14 }}>{item.title}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555f6d" }}>{Array.isArray(item.authors) ? item.authors.join(", ") : item.authors ?? "Unknown"}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: pillStyle.bg, color: pillStyle.color }}>{item.status}</span>
                        <span style={{ fontWeight: 500, color: "#4b5563", fontSize: 12 }}>{isHold ? "Reservation" : "Borrow"}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#555f6d", lineHeight: 1.5 }}>{durationText}</div>
                      <div style={{ textAlign: "right", fontWeight: 700, color: item.status === "overdue" ? "#dc2626" : "#555f6d", fontSize: 13 }}>{item.status === "overdue" ? "100 TK fine" : "No fine"}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr", gap: 16, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px" }}>
                  {["BOOK TITLE / DETAILS","TRANSACTION TYPE","STATUS","TIME DURATION","FINE AMOUNT"].map(c => <div key={c}>{c}</div>)}
                </div>
                {filteredCombinedItems.map((item: any) => {
                  const isHold = "hold_id" in item;
                  let pillStyle = { bg: "#f1f3ff", color: "#555f6d" };
                  if (item.status === "active") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  else if (item.status === "overdue") pillStyle = { bg: "#fde8e8", color: "#c81e1e" };
                  else if (item.status === "pending") pillStyle = { bg: "#e8f0fe", color: "#0D47A1" };
                  else if (item.status === "available") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  const durationText = isHold ? `Reserved on ${new Date(item.request_date).toLocaleDateString()}` : item.status === "returned" && item.return_date ? `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Returned: ${new Date(item.return_date).toLocaleDateString()}` : `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Due: ${new Date(item.due_date).toLocaleDateString()}`;
                  return (
                    <div key={isHold ? item.hold_id : item.transaction_id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr", gap: 16, alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #c8c5cd", fontSize: 13 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f9f9ff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <div><p style={{ margin: 0, fontWeight: 600, color: "#141b2b" }}>{item.title}</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#555f6d" }}>{Array.isArray(item.authors) ? item.authors.join(", ") : item.authors ?? "Unknown"}</p></div>
                      <div style={{ fontWeight: 500, color: "#4b5563" }}>{isHold ? "Reservation" : "Borrow"}</div>
                      <div><span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: pillStyle.bg, color: pillStyle.color }}>{item.status}</span></div>
                      <div style={{ color: "#47464c", fontWeight: 500 }}>{durationText}</div>
                      <div style={{ textAlign: "right", fontWeight: 700, color: item.status === "overdue" ? "#dc2626" : "#555f6d" }}>{item.status === "overdue" ? "100 TK" : "—"}</div>
                    </div>
                  );
                })}
              </>
            )
          ) : !documentsData?.items || documentsData.items.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#555f6d" }}><p>No documents found</p></div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px" }}>
              {documentsData.items.map((doc: any) => {
                const statusStyle = PILL[doc.status] || PILL.draft;
                return (
                  <div key={doc.id} style={{ background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: "#141b2b", fontSize: 14 }}>{doc.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#78767d" }}>{doc.download_count || 0} downloads</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: "#47464c", fontSize: 12 }}>{typeof doc.authors === "string" ? doc.authors : Array.isArray(doc.authors) ? doc.authors.join(", ") : "—"}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#78767d" }}>{doc.department}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: statusStyle.bg, color: statusStyle.color }}>{doc.status}</span>
                      <span style={{ fontSize: 12, color: "#555f6d", textTransform: "capitalize" }}>{doc.access}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#555f6d" }}>
                      <span>{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "—"}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => toast.success("Access level updated")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#f1f3ff", cursor: "pointer", display: "flex", alignItems: "center" }}><Eye size={16} color="#555f6d" /></button>
                        <button onClick={() => toast.success("Document removed")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#fde8e8", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={16} color="#dc2626" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: user?.role === "archivist" ? "0.3fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr" : "2fr 1.5fr 1fr 1fr 1fr 0.8fr", gap: 16, background: "#f9f9ff", borderBottom: "1px solid #c8c5cd", padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#555f6d", letterSpacing: "0.5px" }}>
                {user?.role === "archivist" && (
                  <input
                    type="checkbox"
                    checked={documentsData.items.length > 0 && selectedIds.length === documentsData.items.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(documentsData.items.map((doc: any) => doc.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                )}
                {[user?.role === "researcher" ? "SUBMISSION TITLE" : "DOCUMENT DETAIL", user?.role === "researcher" ? "TYPE / COLLABORATORS" : "AUTHOR / FACULTY", "STATUS", "LAST MODIFIED", "ACCESS", "ACTIONS"].map(c => <div key={c}>{c}</div>)}
              </div>
              {documentsData.items.map((doc: any) => {
                const statusStyle = PILL[doc.status] || PILL.draft;
                return (
                  <div key={doc.id} style={{ display: "grid", gridTemplateColumns: user?.role === "archivist" ? "0.3fr 2fr 1.5fr 1fr 1fr 1fr 0.8fr" : "2fr 1.5fr 1fr 1fr 1fr 0.8fr", gap: 16, alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #c8c5cd", fontSize: 13 }}>
                    {user?.role === "archivist" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, doc.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    )}
                    <div><p style={{ margin: 0, fontWeight: 600, color: "#141b2b" }}>{doc.title}</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#78767d" }}>{doc.download_count || 0} downloads</p></div>
                    <div><p style={{ margin: 0, fontWeight: 500, color: "#47464c" }}>{typeof doc.authors === "string" ? doc.authors : Array.isArray(doc.authors) ? doc.authors.join(", ") : "—"}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: "#78767d" }}>{doc.department}</p></div>
                    <div><span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: statusStyle.bg, color: statusStyle.color }}>{doc.status}</span></div>
                    <p style={{ margin: 0, fontSize: 12, color: "#555f6d" }}>{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "—"}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#555f6d", textTransform: "capitalize" }}>{doc.access}</p>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={() => toast.success("Access level updated")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#f1f3ff", cursor: "pointer", display: "flex", alignItems: "center" }}><Eye size={12} color="#555f6d" /></button>
                      <button onClick={() => toast.success("Document removed")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#fde8e8", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} color="#dc2626" /></button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Pagination for non-student */}
        {!isStudent && documentsData && documentsData.total > 10 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#555f6d", margin: 0 }}>Page {currentPage} of {Math.ceil(documentsData.total / 10)}</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer" }}><ChevronLeft size={13} /></button>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(documentsData.total / 10)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #c8c5cd", background: "#fff", fontSize: 12, color: "#47464c", cursor: "pointer" }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
        </div>{/* closes padding div */}
      </div>{/* closes background div */}
    </AppLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageInner />
    </Suspense>
  );
}
