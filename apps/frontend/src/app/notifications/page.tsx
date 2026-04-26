"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, BookOpen, AlertTriangle, Clock,
  BookMarked, CheckCircle, XCircle, Megaphone, Upload, Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

const NOTIFICATION_TYPES = ["all", "due_date_reminder", "overdue_alert", "hold_available", "announcement", "system"] as const;
type NotifFilter = (typeof NOTIFICATION_TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
  all: "All",
  due_date_reminder: "Due Soon",
  overdue_alert: "Overdue",
  hold_available: "Holds",
  announcement: "Announcements",
  system: "System",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  due_date_reminder:          <Clock size={16} className="text-amber-500" />,
  overdue_alert:              <AlertTriangle size={16} className="text-red-500" />,
  hold_available:             <BookMarked size={16} className="text-emerald-500" />,
  project_approved:           <CheckCircle size={16} className="text-green-500" />,
  project_changes_requested:  <XCircle size={16} className="text-orange-500" />,
  access_request_approved:    <CheckCircle size={16} className="text-green-500" />,
  access_request_denied:      <XCircle size={16} className="text-red-500" />,
  announcement:               <Megaphone size={16} className="text-blue-500" />,
  new_upload:                 <Upload size={16} className="text-purple-500" />,
  system:                     <Settings size={16} className="text-slate-400" />,
};

const PAGE_SIZE = 15;

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const [typeFilter, setTypeFilter] = useState<NotifFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotifications(1, false, isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  type NotifItem = {
    notification_id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    action_url?: string;
    type: string;
  };

  const allNotifs: NotifItem[] = data?.notifications ?? [];

  const filtered = allNotifs.filter((n) =>
    typeFilter === "all" ? true : n.type === typeFilter
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {NOTIFICATION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === t
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {TYPE_LABELS[t] ?? t}
          </button>
        ))}
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

      {!isLoading && paginated.length === 0 && (
        <div className="text-center py-16">
          <Bell className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No notifications</p>
        </div>
      )}

      {!isLoading && paginated.length > 0 && (
        <div className="space-y-2">
          {paginated.map((notif) => (
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
                {/* Type icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {TYPE_ICONS[notif.type] ?? <BookOpen size={16} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
                    )}
                    <div className={!notif.read ? "" : "ml-4"}>
                      <p className={`text-sm font-medium ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

