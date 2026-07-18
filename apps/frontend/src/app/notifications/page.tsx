"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, ArrowUpRight, Trash2, Clock, AlertTriangle, BookOpen,
  CheckCircle2, XCircle, Megaphone, Upload, CalendarClock, UserCheck, FileEdit, Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead, useDeleteNotification, useDeleteAllNotifications } from "@/features/notifications/hooks/useNotifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/Modal";
import { timeAgo } from "@/lib/utils";

interface NotificationItem {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// ── Type → visual treatment ──────────────────────────────────────────────
const TYPE_STYLE: Record<string, { icon: typeof Bell; color: string }> = {
  due_date_reminder:          { icon: Clock,         color: "#d97706" }, // amber
  overdue_alert:               { icon: AlertTriangle, color: "#dc2626" }, // red
  hold_available:              { icon: BookOpen,      color: "#2563eb" }, // blue
  project_approved:            { icon: CheckCircle2,  color: "#059669" }, // green
  project_changes_requested:   { icon: FileEdit,      color: "#d97706" }, // amber
  access_request_approved:     { icon: CheckCircle2,  color: "#059669" }, // green
  access_request_denied:       { icon: XCircle,       color: "#dc2626" }, // red
  announcement:                { icon: Megaphone,     color: "#7c3aed" }, // purple
  new_upload:                  { icon: Upload,        color: "#2563eb" }, // blue
  system:                      { icon: Settings,      color: "#6b7280" }, // gray
  new_event:                   { icon: CalendarClock, color: "#0891b2" }, // teal
  pending_approval:            { icon: UserCheck,     color: "#4f46e5" }, // indigo
};
const DEFAULT_STYLE = { icon: Bell, color: "#6b7280" };

function isToday(d: Date) {
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function isYesterday(d: Date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

function groupByDate(items: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const buckets: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const item of items) {
    const d = new Date(item.created_at);
    if (isToday(d)) buckets.Today.push(item);
    else if (isYesterday(d)) buckets.Yesterday.push(item);
    else buckets.Earlier.push(item);
  }
  for (const label of ["Today", "Yesterday", "Earlier"]) {
    if (buckets[label].length) groups.push({ label, items: buckets[label] });
  }
  return groups;
}

function NotificationCard({ notif, onMarkRead, onNavigate, onDelete, deleting }: {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
  onNavigate: (url: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const isUnread = !notif.read;
  const style = TYPE_STYLE[notif.type] ?? DEFAULT_STYLE;
  const Icon = style.icon;

  return (
    <div
      onClick={() => {
        if (isUnread) onMarkRead(notif.notification_id);
        if (notif.action_url) onNavigate(notif.action_url);
      }}
      style={{
        position: "relative",
        background: isUnread ? `color-mix(in srgb, ${style.color} 4%, #fff)` : "#fff",
        border: "1px solid #eef0f3",
        borderRadius: 14,
        padding: "16px 20px 16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        transition: "box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(16,24,40,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "#e2e5eb";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(16,24,40,0.04)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "#eef0f3";
      }}
    >
      {/* Unread accent bar */}
      {isUnread && (
        <span style={{
          position: "absolute", left: 0, top: 14, bottom: 14, width: 3,
          borderRadius: 3, background: style.color,
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${style.color} 14%, #fff)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={19} color={style.color} strokeWidth={2.25} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.35 }}>
            {notif.title}
          </h3>
          {isUnread && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.color, flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: 13, color: "#5b6371", margin: "0 0 8px", lineHeight: 1.5 }}>
          {notif.message}
        </p>
        <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 500 }}>
          {timeAgo(notif.created_at)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {notif.action_url && (
          <button
            title="View"
            style={{
              width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <ArrowUpRight size={14} />
          </button>
        )}
        <button
          title="Delete"
          disabled={deleting}
          onClick={(e) => { e.stopPropagation(); onDelete(notif.notification_id); }}
          style={{
            width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#9ca3af",
            cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1, transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (!deleting) { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; } }}
          onMouseOut={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.push("/login?redirect=/notifications");
  }, [isAuthenticated, _hasHydrated, router]);

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading } = useNotifications(1, filter === "unread", isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();
  const { mutate: deleteOne, isPending: isDeletingOne, variables: deletingId } = useDeleteNotification();
  const { mutate: deleteAll, isPending: isDeletingAll } = useDeleteAllNotifications();

  const handleDeleteOne = (id: string) => {
    deleteOne(id, {
      onError: () => toast.error("Failed to delete notification"),
    });
  };

  const handleDeleteAll = () => {
    deleteAll(undefined, {
      onSuccess: () => {
        toast.success("All notifications deleted");
        setConfirmDeleteAll(false);
      },
      onError: () => toast.error("Failed to delete notifications"),
    });
  };

  const groups = data?.notifications ? groupByDate(data.notifications) : [];

  return (
    <AppLayout>
      <div style={{ background: "#f7f8fa", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: "36px 40px 28px",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "var(--avatar-theme-color, #1a1a2e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 10px color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 35%, transparent)",
                  }}>
                    <Bell size={18} color="#fff" />
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em" }}>
                    Notifications
                  </h1>
                </div>
                {(data?.unread_count ?? 0) > 0 && (
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                    {`You have ${data.unread_count} unread notification${data.unread_count === 1 ? "" : "s"}.`}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {(data?.unread_count ?? 0) > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={isPending}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
                      borderRadius: 9, fontSize: 13, fontWeight: 600, border: "1px solid transparent",
                      background: "var(--avatar-theme-color, #111827)", color: "#fff",
                      cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => { if (!isPending) e.currentTarget.style.opacity = "0.88"; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = isPending ? "0.6" : "1"; }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                {(data?.notifications?.length ?? 0) > 0 && (
                  <button
                    onClick={() => setConfirmDeleteAll(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
                      borderRadius: 9, fontSize: 13, fontWeight: 600, border: "1px solid #d1d5db",
                      background: "#fff", color: "#374151", cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#fff"; }}
                  >
                    <Trash2 size={14} /> Delete all
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "#eef0f4", gap: 2 }}>
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                    background: filter === f ? "#fff" : "transparent",
                    color: filter === f ? "var(--avatar-theme-color, #111827)" : "#8b93a1",
                    boxShadow: filter === f ? "0 1px 3px rgba(16,24,40,0.1)" : "none",
                  }}
                >
                  {f === "all" ? "All" : `Unread${(data?.unread_count ?? 0) > 0 ? ` (${data.unread_count})` : ""}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 32px 40px", maxWidth: 800, margin: "0 auto" }}>

        <ConfirmDialog
          isOpen={confirmDeleteAll}
          onClose={() => setConfirmDeleteAll(false)}
          onConfirm={handleDeleteAll}
          title="Delete all notifications?"
          description="This permanently deletes every notification in your list. This can't be undone."
          confirmLabel="Delete All"
          variant="danger"
          loading={isDeletingAll}
        />

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #eef0f3", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                <Skeleton className="w-[42px] h-[42px] rounded-xl shrink-0" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!data?.notifications || data.notifications.length === 0) && (
          <div style={{ background: "#fff", border: "1px solid #eef0f3", borderRadius: 16, padding: "64px 32px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(135deg, #f4f6ff 0%, #eef1ff 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <Bell size={24} color="#9ca3af" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
              {filter === "unread" ? "No unread notifications" : "All caught up"}
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {filter === "unread" ? "Nothing new to review right now." : "Nothing here yet — check back later."}
            </p>
          </div>
        )}

        {/* Grouped list */}
        {!isLoading && groups.map((group) => (
          <div key={group.label} style={{ marginBottom: 22 }}>
            <h2 style={{
              fontSize: 11.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 10px 2px",
            }}>
              {group.label}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.items.map((notif) => (
                <NotificationCard
                  key={notif.notification_id}
                  notif={notif}
                  onMarkRead={markRead}
                  onNavigate={(url) => router.push(url)}
                  onDelete={handleDeleteOne}
                  deleting={isDeletingOne && deletingId === notif.notification_id}
                />
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </AppLayout>
  );
}
