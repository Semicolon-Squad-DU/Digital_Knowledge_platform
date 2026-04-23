"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {data?.unread_count > 0 && (
            <p className="text-sm text-gray-600 mt-1">{data.unread_count} unread</p>
          )}
        </div>
        {data?.unread_count > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()} loading={isPending}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data?.notifications?.length === 0 && (
        <div className="text-center py-16">
          <Bell className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}

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
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                !notif.read ? "border-primary-200 bg-primary-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
                )}
                <div className={!notif.read ? "" : "ml-5"}>
                  <p className={`text-sm font-medium ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
