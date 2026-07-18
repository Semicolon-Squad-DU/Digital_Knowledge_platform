import {
  Bell, ArrowUpRight, Trash2, Clock, AlertTriangle, BookOpen,
  CheckCircle2, XCircle, Megaphone, Upload, CalendarClock, UserCheck, FileEdit, Settings,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

export interface NotificationItem {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// ── Type → visual treatment ──────────────────────────────────────────────
export const TYPE_STYLE: Record<string, { icon: typeof Bell; color: string }> = {
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
export const DEFAULT_STYLE = { icon: Bell, color: "#6b7280" };

function isToday(d: Date) {
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function isYesterday(d: Date) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

export function groupByDate(items: NotificationItem[]) {
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

export function NotificationCard({ notif, onMarkRead, onNavigate, onDelete, deleting }: {
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
