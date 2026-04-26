"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, AlertCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory } from "@/hooks/useLibrary";
import { getStatusBadge, formatDate } from "@/lib/utils";

type StatusFilter = "all" | "active" | "returned" | "overdue";

export default function DashboardHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data, isLoading } = useBorrowingHistory(user?.user_id ?? "");

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!data) return [];

    let filtered = data as Array<{
      transaction_id: string;
      title: string;
      issue_date: string;
      due_date: string;
      return_date?: string;
      status: string;
      fine?: number;
    }>;

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((item) => !item.return_date && new Date(item.due_date) > new Date());
    } else if (statusFilter === "returned") {
      filtered = filtered.filter((item) => item.return_date);
    } else if (statusFilter === "overdue") {
      filtered = filtered.filter((item) => !item.return_date && new Date(item.due_date) < new Date());
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((item) => new Date(item.issue_date) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter((item) => new Date(item.issue_date) <= new Date(dateRange.to));
    }

    return filtered;
  }, [data, statusFilter, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredData, currentPage]
  );

  // Calculate fines summary
  const finesSummary = useMemo(() => {
    if (!data) return { totalFines: 0, overdueCount: 0, pendingFines: 0 };

    const overdueItems = data.filter(
      (item: any) => !item.return_date && new Date(item.due_date) < new Date()
    );
    const totalFines = data.reduce((sum: number, item: any) => sum + (item.fine || 0), 0);
    const pendingFines = overdueItems.reduce((sum: number, item: any) => sum + (item.fine || 0), 0);

    return {
      totalFines,
      overdueCount: overdueItems.length,
      pendingFines,
    };
  }, [data]);

  const resetFilters = () => {
    setStatusFilter("all");
    setDateRange({ from: "", to: "" });
    setCurrentPage(1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Borrowing History</h1>
          <p className="text-slate-600 mt-1">Track all your book borrowing transactions</p>
        </div>

        {/* Fines Summary Cards */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Overdue Books */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Overdue Books</p>
                  <p className="text-2xl font-bold text-red-900 mt-2">{finesSummary.overdueCount}</p>
                </div>
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            {/* Pending Fines */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Pending Fines</p>
                  <p className="text-2xl font-bold text-orange-900 mt-2">₹{finesSummary.pendingFines.toFixed(2)}</p>
                </div>
                <Clock className="text-orange-500" size={32} />
              </div>
            </div>

            {/* Total Fines */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Fines</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">₹{finesSummary.totalFines.toFixed(2)}</p>
                </div>
                <CheckCircle2 className="text-green-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="space-y-4">
            {/* Status Filter Tabs */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Filter by Status</p>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "returned", "overdue"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status as StatusFilter);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === status
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Filter by Date Range</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange((prev) => ({ ...prev, from: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="From date"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange((prev) => ({ ...prev, to: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="To date"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-slate-600 pt-2 border-t border-slate-200">
              Showing <span className="font-semibold">{paginatedData.length}</span> of{" "}
              <span className="font-semibold">{filteredData.length}</span> results
            </div>
          </div>
        </div>

        {/* History List */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!filteredData || filteredData.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <AlertCircle className="mx-auto text-slate-400 mb-3" size={40} />
            <p className="text-slate-600 font-medium">No borrowing history found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {!isLoading && paginatedData.length > 0 && (
          <>
            {/* History Items */}
            <div className="space-y-4 mb-6">
              {paginatedData.map(
                (item: {
                  transaction_id: string;
                  title: string;
                  issue_date: string;
                  due_date: string;
                  return_date?: string;
                  status: string;
                  fine?: number;
                }) => {
                  const status = getStatusBadge(item.status);
                  const isOverdue = !item.return_date && new Date(item.due_date) < new Date();

                  return (
                    <div
                      key={item.transaction_id}
                      className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                        isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-slate-900 text-lg">{item.title}</p>
                            {isOverdue && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Issued</p>
                              <p className="text-slate-900 font-medium mt-0.5">{formatDate(item.issue_date)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Due</p>
                              <p className={`font-medium mt-0.5 ${isOverdue ? "text-red-600" : "text-slate-900"}`}>
                                {formatDate(item.due_date)}
                              </p>
                            </div>
                            {item.return_date && (
                              <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Returned</p>
                                <p className="text-slate-900 font-medium mt-0.5">{formatDate(item.return_date)}</p>
                              </div>
                            )}
                            {item.fine && item.fine > 0 && (
                              <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Fine</p>
                                <p className="text-red-600 font-bold mt-0.5">₹{item.fine.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full font-medium text-xs whitespace-nowrap ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
