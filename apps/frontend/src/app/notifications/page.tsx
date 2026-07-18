"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationRead, useMarkAllRead, useDeleteNotification, useDeleteAllNotifications } from "@/features/notifications/hooks/useNotifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/Modal";
import { NotificationCard, groupByDate } from "./NotificationCard";

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
      <div style={{ background: "#f1f3ff", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f1f3ff 60%, #f1f3ff 100%)",
          borderBottom: "1px solid #c8c5cd",
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
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: "#141b2b", margin: 0, letterSpacing: "-0.03em" }}>
                    Notifications
                  </h1>
                </div>
                {(data?.unread_count ?? 0) > 0 && (
                  <p style={{ fontSize: 13, color: "#78767d", margin: 0 }}>
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
                      background: "var(--avatar-theme-color, #141b2b)", color: "#fff",
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
                      borderRadius: 9, fontSize: 13, fontWeight: 600, border: "1px solid #c8c5cd",
                      background: "#fff", color: "#47464c", cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "#47464c"; e.currentTarget.style.borderColor = "#c8c5cd"; e.currentTarget.style.background = "#fff"; }}
                  >
                    <Trash2 size={14} /> Delete all
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "#f1f3ff", gap: 2 }}>
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                    background: filter === f ? "#fff" : "transparent",
                    color: filter === f ? "var(--avatar-theme-color, #141b2b)" : "#8b93a1",
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
              <div key={i} style={{ background: "#fff", border: "1px solid #f1f3ff", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
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
          <div style={{ background: "#fff", border: "1px solid #f1f3ff", borderRadius: 16, padding: "64px 32px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(135deg, #f1f3ff 0%, #f1f3ff 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <Bell size={24} color="#78767d" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141b2b", margin: "0 0 6px" }}>
              {filter === "unread" ? "No unread notifications" : "All caught up"}
            </h3>
            <p style={{ fontSize: 13, color: "#555f6d", margin: 0 }}>
              {filter === "unread" ? "Nothing new to review right now." : "Nothing here yet — check back later."}
            </p>
          </div>
        )}

        {/* Grouped list */}
        {!isLoading && groups.map((group) => (
          <div key={group.label} style={{ marginBottom: 22 }}>
            <h2 style={{
              fontSize: 11.5, fontWeight: 700, color: "#78767d", textTransform: "uppercase",
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
