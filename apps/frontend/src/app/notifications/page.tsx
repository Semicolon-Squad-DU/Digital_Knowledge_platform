"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  BookOpen,
  Microscope,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
  Heart,
  MessageSquare,
  Award,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";

type FilterType = "all" | "unread" | "library" | "research" | "showcase" | "system";

// Icon mapping for notification types
const notificationIconMap: Record<string, { Icon: any; color: string; bg: string }> = {
  library: { Icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
  research: { Icon: Microscope, color: "text-purple-600", bg: "bg-purple-100" },
  showcase: { Icon: Palette, color: "text-pink-600", bg: "bg-pink-100" },
  system: { Icon: Settings, color: "text-slate-600", bg: "bg-slate-100" },
  test: { Icon: AlertCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  borrow: { Icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  review: { Icon: Heart, color: "text-red-600", bg: "bg-red-100" },
  comment: { Icon: MessageSquare, color: "text-cyan-600", bg: "bg-cyan-100" },
  achievement: { Icon: Award, color: "text-yellow-600", bg: "bg-yellow-100" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  // Refetch when page becomes visible
  const { data, isLoading, refetch } = useNotifications(1, false, isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (!data?.notifications) return [];

    let filtered = [...data.notifications];

    if (filterType === "unread") {
      filtered = filtered.filter((notif: any) => !notif.read);
    } else if (filterType !== "all") {
      filtered = filtered.filter((notif: any) =>
        notif.title.toLowerCase().includes(filterType) || notif.message.toLowerCase().includes(filterType)
      );
    }

    return filtered;
  }, [data?.notifications, filterType]);

  // Paginate filtered notifications
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = useMemo(
    () => filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredNotifications, currentPage]
  );

  // Get notification icon
  const getNotificationIcon = (notif: any) => {
    const notifText = (notif.title + " " + notif.message).toLowerCase();

    for (const [key, value] of Object.entries(notificationIconMap)) {
      if (notifText.includes(key)) {
        return value;
      }
    }

    return { Icon: Bell, color: "text-slate-600", bg: "bg-slate-100" };
  };

  // Count by type
  const countByType = useMemo(() => {
    if (!data?.notifications) return {};

    const counts: Record<string, number> = {
      all: data.notifications.length,
      unread: data.notifications.filter((n: any) => !n.read).length,
      library: 0,
      research: 0,
      showcase: 0,
      system: 0,
    };

    data.notifications.forEach((notif: any) => {
      const text = (notif.title + " " + notif.message).toLowerCase();
      if (text.includes("library") || text.includes("borrow")) counts.library++;
      else if (text.includes("research")) counts.research++;
      else if (text.includes("showcase")) counts.showcase++;
      else counts.system++;
    });

    return counts;
  }, [data?.notifications]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) markRead(notif.notification_id);
    if (notif.action_url) router.push(notif.action_url);
  };

  const handleCreateTestNotification = async () => {
    setIsCreatingTest(true);
    try {
      await api.post("/notifications/test");
      toast.success("Test notification created! Check back in a few seconds.");
      // Refetch after a short delay
      setTimeout(() => refetch(), 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create test notification");
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-600 mt-1">
              {data?.unread_count || 0} unread · {data?.notifications?.length || 0} total
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCreateTestNotification}
              disabled={isCreatingTest}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              title="Create a test notification to verify the notification system"
            >
              <Plus size={18} />
              {isCreatingTest ? "Creating..." : "Test Notification"}
            </button>
            {data?.unread_count > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={isPending}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <CheckCheck size={18} />
                {isPending ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            {[
              { key: "all", label: "All", icon: Bell },
              { key: "unread", label: "Unread", icon: AlertCircle },
              { key: "library", label: "Library", icon: BookOpen },
              { key: "research", label: "Research", icon: Microscope },
              { key: "showcase", label: "Showcase", icon: Palette },
              { key: "system", label: "System", icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setFilterType(key as FilterType);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filterType === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon size={16} />
                {label}
                {countByType[key] && (
                  <span
                    className={`ml-1 text-xs font-bold ${
                      filterType === key
                        ? "bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-900"
                    } rounded-full w-5 h-5 flex items-center justify-center`}
                  >
                    {countByType[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && paginatedNotifications.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Bell className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600 font-medium text-lg">No notifications yet</p>
            <p className="text-sm text-slate-500 mt-1">
              {filterType === "all"
                ? "You're all caught up! Check back later."
                : `No notifications in ${filterType} category.`}
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && paginatedNotifications.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {paginatedNotifications.map((notif: any) => {
                const iconInfo = getNotificationIcon(notif);
                const Icon = iconInfo.Icon;

                return (
                  <div
                    key={notif.notification_id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                      !notif.read
                        ? "border-blue-200 bg-blue-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconInfo.bg}`}
                      >
                        <Icon className={`${iconInfo.color}`} size={24} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={`font-semibold text-sm leading-snug ${
                                !notif.read ? "text-slate-900" : "text-slate-700"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>

                          {/* Unread Badge */}
                          {!notif.read && (
                            <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-600 mt-1" />
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-slate-500 mt-2">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
