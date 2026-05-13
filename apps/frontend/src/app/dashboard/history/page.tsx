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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-2xl font-medium text-on-surface tracking-tight mb-6">Borrowing history</h1>

        {isLoading && <p className="text-sm text-on-surface-variant">Loading history…</p>}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-on-surface-variant">No borrowing history found.</p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.map(
              (item: {
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
                    className="rounded-lg border border-outline-variant bg-surface-container px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
                      <p className="text-xs mt-0.5 text-on-surface-variant">
                        Issued: {formatDate(item.issue_date)} · Due: {formatDate(item.due_date)}
                        {item.return_date ? ` · Returned: ${formatDate(item.return_date)}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
