"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";

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
      <div style={{ padding: "28px 32px", maxWidth: 760 }}>
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
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
                cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1,
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && data?.notifications?.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Bell size={24} color="#9ca3af" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>All caught up</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No notifications yet.</p>
          </div>
        )}

        {/* List */}
        {!isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data?.notifications?.map((notif: {
              notification_id: string; title: string; message: string;
              read: boolean; created_at: string; action_url?: string;
            }) => (
              <div
                key={notif.notification_id}
                onClick={() => {
                  if (!notif.read) markRead(notif.notification_id);
                  if (notif.action_url) router.push(notif.action_url);
                }}
                style={{
                  background: notif.read ? "#fff" : "#eff6ff",
                  border: `1px solid ${notif.read ? "#e5e7eb" : "#bfdbfe"}`,
                  borderRadius: 8, padding: "16px 20px",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = notif.read ? "#f9fafb" : "#dbeafe")}
                onMouseLeave={e => (e.currentTarget.style.background = notif.read ? "#fff" : "#eff6ff")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 5 }} />
                  )}
                  <div style={{ flex: 1, marginLeft: notif.read ? 20 : 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{notif.title}</p>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px" }}>{notif.message}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{timeAgo(notif.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
