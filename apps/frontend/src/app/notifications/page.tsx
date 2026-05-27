"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";

interface NotificationItem {
  notification_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

function NotificationCard({ notif, onMarkRead, onNavigate }: {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const isUnread = !notif.read;
  return (
    <div
      onClick={() => {
        if (isUnread) onMarkRead(notif.notification_id);
        if (notif.action_url) onNavigate(notif.action_url);
      }}
      style={{
        background: isUnread ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 3%, #fff)" : "#fff",
        border: `1px solid ${isUnread ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 20%, #e5e7eb)" : "#e5e7eb"}`,
        borderRadius: 8,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = isUnread ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 7%, #fff)" : "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.background = isUnread ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 3%, #fff)" : "#fff")}
    >
      {/* Icon Spine */}
      <div style={{
        width: 48,
        height: 56,
        borderRadius: 6,
        flexShrink: 0,
        background: isUnread ? "var(--avatar-theme-color, #2563eb)" : "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}>
        <Bell size={20} color={isUnread ? "#fff" : "#9ca3af"} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px", lineHeight: 1.4 }}>
          {notif.title}
        </h3>
        <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 8px", lineHeight: 1.5 }}>
          {notif.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: isUnread ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 12%, transparent)" : "#f3f4f6",
            color: isUnread ? "var(--avatar-theme-color, #2563eb)" : "#6b7280",
          }}>
            {isUnread ? "New" : "Read"}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {timeAgo(notif.created_at)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {notif.action_url && (
        <div style={{ flexShrink: 0 }}>
          <button style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            background: isUnread ? "var(--avatar-theme-color, #2563eb)" : "#374151",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
            onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseOut={(e) => e.currentTarget.style.filter = "none"}
          >
            <span>View</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/notifications");
  }, [isAuthenticated, router]);

  const { data, isLoading } = useNotifications(1, false, isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }}>
        
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
              Notifications
            </h1>
            {(data?.unread_count ?? 0) > 0 && (
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {data.unread_count} unread
              </p>
            )}
          </div>
          {(data?.unread_count ?? 0) > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                background: "var(--avatar-theme-color, #111827)",
                color: "#fff",
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!isPending) {
                  e.currentTarget.style.filter = "brightness(1.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!isPending) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                <Skeleton className="w-12 h-14 rounded shrink-0" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!data?.notifications || data.notifications.length === 0) && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Bell size={24} color="#9ca3af" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>All caught up</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No notifications yet.</p>
          </div>
        )}

        {/* List */}
        {!isLoading && data?.notifications && data.notifications.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.notifications.map((notif: NotificationItem) => (
              <NotificationCard
                key={notif.notification_id}
                notif={notif}
                onMarkRead={markRead}
                onNavigate={(url) => router.push(url)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
