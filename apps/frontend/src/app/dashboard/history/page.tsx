"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory } from "@/hooks/useLibrary";
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Borrowing History</h1>

      {isLoading && <p className="text-sm text-slate-500">Loading history...</p>}

      {!isLoading && (!data || data.length === 0) && (
        <p className="text-sm text-slate-500">No borrowing history found.</p>
      )}

      {!isLoading && data?.length > 0 && (
        <div className="space-y-3">
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
              <div key={item.transaction_id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Issued: {formatDate(item.issue_date)} · Due: {formatDate(item.due_date)}
                      {item.return_date ? ` · Returned: ${formatDate(item.return_date)}` : ""}
                    </p>
                  </div>
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
