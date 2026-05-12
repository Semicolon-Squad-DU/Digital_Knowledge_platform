"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory } from "@/features/library/hooks/useLibrary";
import { getStatusBadge, formatDate } from "@/lib/utils";

export default function DashboardHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data, isLoading } = useBorrowingHistory(user?.user_id ?? "");

  if (!user) return null;

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
          }) => {
            const status = getStatusBadge(item.status);
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
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${status.color}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
