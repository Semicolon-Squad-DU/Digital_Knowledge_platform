"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory, useMemberFines } from "@/hooks/useLibrary";
import { getStatusBadge, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Banknote } from "lucide-react";

const STATUS_OPTIONS = ["all", "active", "returned", "overdue"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const PAGE_SIZE = 10;

export default function DashboardHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data, isLoading } = useBorrowingHistory(user?.user_id ?? "");
  const { data: fineData } = useMemberFines(user?.user_id ?? "");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  if (!user) return null;

  type TxnItem = {
    transaction_id: string;
    title: string;
    issue_date: string;
    due_date: string;
    return_date?: string;
    status: string;
    fine_amount?: number;
  };

  const filtered: TxnItem[] = (data ?? []).filter((item: TxnItem) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (dateFrom && new Date(item.issue_date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(item.issue_date) > new Date(dateTo)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalFines   = fineData?.total_pending ?? 0;
  const pendingFines = (fineData?.fines ?? []).filter((f: { status: string }) => f.status === "pending").length;

  const handleFilterChange = () => setPage(1);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Borrowing History</h1>

      {/* Fines summary */}
      {totalFines > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <Banknote className="text-amber-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Outstanding Fines: Tk {totalFines.toFixed(2)}
            </p>
            <p className="text-xs text-amber-600">{pendingFines} pending fine(s)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); handleFilterChange(); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
            placeholder="From"
            className="text-xs py-1"
          />
          <span className="text-slate-400 text-xs">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
            placeholder="To"
            className="text-xs py-1"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDateFrom(""); setDateTo(""); handleFilterChange(); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading history...</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-slate-500">No borrowing records match the selected filters.</p>
      )}

      {!isLoading && paginated.length > 0 && (
        <div className="space-y-3">
          {paginated.map((item) => {
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
                    {(item.fine_amount ?? 0) > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Fine: Tk {Number(item.fine_amount).toFixed(2)}
                      </p>
                    )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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

