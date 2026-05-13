"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, AlertTriangle, Bell, BookMarked, ArrowRight, Banknote } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory, useMemberFines } from "@/features/library/hooks/useLibrary";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, timeAgo } from "@/lib/utils";

const panel = "rounded-lg border border-outline-variant bg-surface-container overflow-hidden";
const panelHead =
  "flex items-center justify-between px-4 py-3 bg-surface-container-high border-b border-outline-variant";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data: history, isLoading: historyLoading } = useBorrowingHistory(user?.user_id ?? "");
  const { data: fineData } = useMemberFines(user?.user_id ?? "");
  const { data: notifData } = useNotifications(1, false, isAuthenticated);

  if (!user) return null;

  const activeLoans = history?.filter((t: { status: string }) => t.status === "active") ?? [];
  const overdueLoans = history?.filter((t: { status: string }) => t.status === "overdue") ?? [];
  const recentNotifs = notifData?.notifications?.slice(0, 5) ?? [];
  const totalFines = fineData?.total_pending ?? 0;

  const stats = [
    { label: "Active Borrows", value: activeLoans.length, icon: BookOpen, href: "/dashboard/history" },
    { label: "Overdue", value: overdueLoans.length, icon: AlertTriangle, href: "/dashboard/history" },
    { label: "Outstanding Fines", value: `Tk ${totalFines.toFixed(0)}`, icon: Clock, href: "/dashboard/history" },
    {
      label: "Unread Notifications",
      value: notifData?.unread_count ?? 0,
      icon: Bell,
      href: "/notifications",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-6">
        <div className="mb-6 pb-4 border-b border-outline-variant">
          <h1 className="font-display text-xl font-medium text-on-surface tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm mt-1 text-on-surface-variant">
            {user.department && `${user.department} · `}
            <span className="capitalize">{user.role?.replace("_", " ")}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {historyLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            : stats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="block">
                  <div
                    className={`${panel} p-4 flex items-center gap-3 hover:border-primary/50 transition-colors duration-100`}
                  >
                    <div className="stat-icon">
                      <stat.icon size={16} />
                    </div>
                    <div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={panel}>
            <div className={panelHead}>
              <div className="flex items-center gap-2">
                <BookMarked size={15} className="text-on-surface-variant" />
                <span className="text-sm font-semibold text-on-surface">Active Borrows</span>
              </div>
              <Link href="/dashboard/history" className="text-xs flex items-center gap-1 text-primary hover:text-primary-fixed">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="p-3">
              {historyLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : activeLoans.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={20} />}
                  title="No active borrows"
                  description="Visit the library catalog to borrow books."
                  className="py-8"
                />
              ) : (
                <div>
                  {activeLoans.slice(0, 5).map(
                    (
                      loan: { transaction_id: string; title: string; due_date: string; status: string },
                      i: number
                    ) => {
                      const isOverdue = new Date(loan.due_date) < new Date();
                      return (
                        <div
                          key={loan.transaction_id}
                          className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-0"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="text-sm font-medium line-clamp-1 text-on-surface">{loan.title}</p>
                            <p
                              className={`text-xs mt-0.5 ${isOverdue ? "text-error" : "text-on-surface-variant"}`}
                            >
                              Due {formatDate(loan.due_date)}
                              {isOverdue && " — OVERDUE"}
                            </p>
                          </div>
                          <StatusBadge status={isOverdue ? "overdue" : loan.status} />
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className={panel}>
              <div className={panelHead}>
                <div className="flex items-center gap-2">
                  <Banknote size={15} className="text-on-surface-variant" />
                  <span className="text-sm font-semibold text-on-surface">Pending Fines</span>
                </div>
              </div>

              <div className="p-3">
                {historyLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : !fineData?.fines || fineData.fines.length === 0 ? (
                  <EmptyState
                    icon={<Banknote size={20} />}
                    title="No pending fines"
                    description="Keep up the great reading!"
                    className="py-8"
                  />
                ) : (
                  <div>
                    <div className="mb-3 pb-3 border-b border-outline-variant">
                      <p className="text-xs text-on-surface-variant">Total Outstanding</p>
                      <p className="text-2xl font-bold text-error">Tk {(fineData.total_pending ?? 0).toFixed(2)}</p>
                    </div>

                    <div>
                      {fineData.fines.slice(0, 4).map(
                        (
                          fine: {
                            fine_id: string;
                            book_title: string;
                            amount: number;
                            reason: string;
                            status: string;
                          }
                        ) => (
                          <div
                            key={fine.fine_id}
                            className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-0"
                          >
                            <div className="min-w-0 flex-1 mr-3">
                              <p className="text-sm font-medium line-clamp-1 text-on-surface">{fine.book_title}</p>
                              <p className="text-xs mt-0.5 text-on-surface-variant">{fine.reason}</p>
                            </div>
                            <p className="text-sm font-semibold text-error">Tk {fine.amount.toFixed(2)}</p>
                          </div>
                        )
                      )}
                    </div>

                    {(fineData.fines?.length ?? 0) > 4 && (
                      <Link
                        href="/dashboard/history"
                        className="text-xs flex items-center justify-center gap-1 mt-3 pt-2 border-t border-outline-variant text-primary hover:text-primary-fixed"
                      >
                        View all fines <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={panel}>
              <div className={panelHead}>
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-on-surface-variant" />
                  <span className="text-sm font-semibold text-on-surface">Notifications</span>
                  {(notifData?.unread_count ?? 0) > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary text-on-primary">
                      {notifData?.unread_count}
                    </span>
                  )}
                </div>
                <Link href="/notifications" className="text-xs flex items-center gap-1 text-primary hover:text-primary-fixed">
                  View all <ArrowRight size={11} />
                </Link>
              </div>

              <div className="p-3">
                {recentNotifs.length === 0 ? (
                  <EmptyState
                    icon={<Bell size={20} />}
                    title="All caught up"
                    description="No new notifications."
                    className="py-8"
                  />
                ) : (
                  <div>
                    {recentNotifs.map(
                      (
                        notif: {
                          notification_id: string;
                          title: string;
                          message: string;
                          read: boolean;
                          created_at: string;
                        }
                      ) => (
                        <div
                          key={notif.notification_id}
                          className="flex gap-3 py-2 px-2 rounded-md hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-0"
                        >
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" aria-hidden />
                          )}
                          <div className={!notif.read ? "" : "ml-5"}>
                            <p className="text-sm font-medium text-on-surface">{notif.title}</p>
                            <p className="text-xs mt-0.5 line-clamp-1 text-on-surface-variant">{notif.message}</p>
                            <p className="text-xs mt-0.5 text-on-surface-variant/70">{timeAgo(notif.created_at)}</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
