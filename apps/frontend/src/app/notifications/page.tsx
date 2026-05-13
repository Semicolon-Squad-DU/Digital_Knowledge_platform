"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/features/notifications/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data, isLoading } = useNotifications(1, false, isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          {data?.unread_count > 0 && (
            <p className="page-subtitle">{data.unread_count} unread</p>
          )}
        </div>
        {data?.unread_count > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()} loading={isPending}>
            <CheckCheck size={16} className="mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border p-4"
              style={{
                background: "var(--color-canvas-default)",
                borderColor: "var(--color-border-default)",
              }}
            >
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data?.notifications?.length === 0 && (
        <div className="empty-state">
          <Bell className="empty-state-icon" size={48} />
          <p className="empty-state-title">No notifications yet</p>
          <p className="empty-state-desc">You&apos;ll see updates about your loans, requests, and activity here.</p>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && (
        <div className="space-y-2">
          {data?.notifications?.map((notif: {
            notification_id: string;
            title: string;
            message: string;
            read: boolean;
            created_at: string;
            action_url?: string;
          }) => (
            <div
              key={notif.notification_id}
              onClick={() => {
                if (!notif.read) markRead(notif.notification_id);
                if (notif.action_url) router.push(notif.action_url);
              }}
              className="rounded-md border p-4 cursor-pointer transition-colors duration-100"
              style={{
                background: !notif.read
                  ? "var(--color-accent-subtle)"
                  : "var(--color-canvas-default)",
                borderColor: !notif.read
                  ? "var(--color-accent-emphasis)"
                  : "var(--color-border-default)",
              }}
            >
              <div className="flex items-start gap-3">
                {!notif.read && (
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: "var(--color-accent-emphasis)" }}
                  />
                )}
                <div className={!notif.read ? "" : "ml-5"}>
                  <p className="text-sm font-medium" style={{ color: "var(--color-fg-default)" }}>
                    {notif.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
                    {notif.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-fg-subtle)" }}>
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
