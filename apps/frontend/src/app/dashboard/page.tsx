"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, AlertTriangle, Bell, BookMarked, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory, useMemberFines } from "@/hooks/useLibrary";
import { useNotifications } from "@/hooks/useNotifications";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, timeAgo } from "@/lib/utils";

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

  const activeLoans  = history?.filter((t: { status: string }) => t.status === "active")  ?? [];
  const overdueLoans = history?.filter((t: { status: string }) => t.status === "overdue") ?? [];
  const recentNotifs = notifData?.notifications?.slice(0, 5) ?? [];
  const totalFines   = fineData?.total_pending ?? 0;

  const stats = [
    { label: "Active Borrows",     value: activeLoans.length,          icon: BookOpen,      href: "/dashboard/history" },
    { label: "Overdue",            value: overdueLoans.length,         icon: AlertTriangle, href: "/dashboard/history" },
    { label: "Outstanding Fines",  value: `Tk ${totalFines.toFixed(0)}`, icon: Clock,       href: "/dashboard/history" },
    { label: "Unread Notifications", value: notifData?.unread_count ?? 0, icon: Bell,       href: "/notifications" },
  ];

  return (
    <div className="page-container py-6">

      {/* Page header */}
      <div className="mb-6 pb-4" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-fg-default)" }}>
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-fg-muted)" }}>
          {user.department && `${user.department} · `}
          <span className="capitalize">{user.role?.replace("_", " ")}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {historyLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="block">
                <div
                  className="gh-box p-4 flex items-center gap-3 hover:border-[var(--color-accent-fg)] transition-colors duration-100"
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

        {/* Active borrows */}
        <div className="gh-box overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border-default)" }}
          >
            <div className="flex items-center gap-2">
              <BookMarked size={15} style={{ color: "var(--color-fg-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>Active Borrows</span>
            </div>
            <Link href="/dashboard/history" className="text-xs flex items-center gap-1" style={{ color: "var(--color-accent-fg)" }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>

          <div className="p-3">
            {historyLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
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
                {activeLoans.slice(0, 5).map((loan: { transaction_id: string; title: string; due_date: string; status: string }, i: number) => {
                  const isOverdue = new Date(loan.due_date) < new Date();
                  return (
                    <div
                      key={loan.transaction_id}
                      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-[var(--color-canvas-subtle)] transition-colors"
                      style={{ borderBottom: i < activeLoans.slice(0, 5).length - 1 ? "1px solid var(--color-border-muted)" : "none" }}
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--color-fg-default)" }}>{loan.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: isOverdue ? "var(--color-danger-fg)" : "var(--color-fg-muted)" }}>
                          Due {formatDate(loan.due_date)}{isOverdue && " — OVERDUE"}
                        </p>
                      </div>
                      <StatusBadge status={isOverdue ? "overdue" : loan.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="gh-box overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border-default)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: "var(--color-fg-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>Notifications</span>
              {(notifData?.unread_count ?? 0) > 0 && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ background: "var(--color-accent-emphasis)" }}
                >
                  {notifData?.unread_count}
                </span>
              )}
            </div>
            <Link href="/notifications" className="text-xs flex items-center gap-1" style={{ color: "var(--color-accent-fg)" }}>
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
                {recentNotifs.map((notif: { notification_id: string; title: string; message: string; read: boolean; created_at: string }, i: number) => (
                  <div
                    key={notif.notification_id}
                    className="flex gap-3 py-2 px-2 rounded-md hover:bg-[var(--color-canvas-subtle)] transition-colors"
                    style={{ borderBottom: i < recentNotifs.length - 1 ? "1px solid var(--color-border-muted)" : "none" }}
                  >
                    {!notif.read && (
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: "var(--color-accent-fg)" }}
                      />
                    )}
                    <div className={!notif.read ? "" : "ml-5"}>
                      <p className="text-sm font-medium" style={{ color: "var(--color-fg-default)" }}>{notif.title}</p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-fg-muted)" }}>{notif.message}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-subtle)" }}>{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
