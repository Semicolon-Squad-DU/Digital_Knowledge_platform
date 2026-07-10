"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useBorrowingHistory, useRenewBook } from "@/features/library/hooks/useLibrary";
import { getStatusBadge, formatDate } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardHistoryPage() {
  const { user, ready } = useAuthGuard();
  const { data, isLoading, refetch } = useBorrowingHistory(user?.user_id ?? "");
  const { mutateAsync: renewBook, isPending: isRenewing, variables: renewingId } = useRenewBook();

  const handleRenew = async (transactionId: string) => {
    try {
      const result = await renewBook(transactionId);
      toast.success(`Renewed! ${result.renewals_left} renewal(s) left.`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not renew this loan");
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Borrowing History</h1>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>Loading history…</p>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>No borrowing history found.</p>
      )}

      {!isLoading && data?.length > 0 && (
        <div className="space-y-2">
          {data.map((item: {
            transaction_id: string;
            title: string;
            issue_date: string;
            due_date: string;
            return_date?: string;
            status: string;
            renewal_count?: number;
          }) => {
            const status = getStatusBadge(item.status);
            const canRenew = item.status === "active";
            return (
              <div
                key={item.transaction_id}
                className="rounded-md border px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  background: "var(--color-canvas-default)",
                  borderColor: "var(--color-border-default)",
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-fg-default)" }}>
                    {item.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
                    Issued: {formatDate(item.issue_date)} · Due: {formatDate(item.due_date)}
                    {item.return_date ? ` · Returned: ${formatDate(item.return_date)}` : ""}
                    {typeof item.renewal_count === "number" && item.renewal_count > 0 ? ` · Renewed ${item.renewal_count}x` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canRenew && (
                    <button
                      onClick={() => handleRenew(item.transaction_id)}
                      disabled={isRenewing && renewingId === item.transaction_id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--color-accent-fg)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-subtle)] disabled:opacity-50 transition-colors"
                    >
                      <RotateCw size={11} className={isRenewing && renewingId === item.transaction_id ? "animate-spin" : ""} />
                      Renew
                    </button>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
