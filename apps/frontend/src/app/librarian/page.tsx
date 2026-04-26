"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, RotateCcw, Clock, Banknote, Plus, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLibrarianDashboard, useIssueBook, useReturnBook } from "@/hooks/useLibrary";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonTableRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !["librarian", "admin"].includes(user?.role ?? "")) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const { data: stats, isLoading, refetch } = useLibrarianDashboard();
  const { mutateAsync: issueBook, isPending: isIssuing } = useIssueBook();
  const { mutateAsync: returnBook, isPending: isReturning } = useReturnBook();

  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [catalogId, setCatalogId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const handleIssue = async () => {
    if (!catalogId.trim() || !memberId.trim()) {
      toast.error("Both Catalog ID and Member ID are required");
      return;
    }
    try {
      await issueBook({ catalog_id: catalogId.trim(), member_id: memberId.trim() });
      toast.success("Book issued successfully");
      setIssueModal(false);
      setCatalogId("");
      setMemberId("");
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to issue book");
    }
  };

  const handleReturn = async () => {
    if (!transactionId.trim()) {
      toast.error("Transaction ID is required");
      return;
    }
    try {
      const result = await returnBook(transactionId.trim());
      const fine = result.fine_amount;
      toast.success(
        fine > 0
          ? `Book returned. Fine applied: Tk ${fine.toFixed(2)}`
          : "Book returned successfully"
      );
      setReturnModal(false);
      setTransactionId("");
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to process return");
    }
  };

  const statCards = [
    { label: "On Loan",       value: stats?.on_loan ?? 0,           icon: BookOpen,      iconClass: "bg-blue-50 text-blue-600" },
    { label: "Overdue",       value: stats?.overdue ?? 0,           icon: AlertTriangle, iconClass: (stats?.overdue ?? 0) > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400" },
    { label: "Returns Today", value: stats?.returns_today ?? 0,     icon: RotateCcw,     iconClass: "bg-green-50 text-green-600" },
    { label: "Holds Pending", value: stats?.holds_pending ?? 0,     icon: Clock,         iconClass: "bg-amber-50 text-amber-600" },
    { label: "Fines (Tk)",    value: (stats?.total_fines_amount ?? 0).toFixed(0), icon: Banknote, iconClass: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="page-container py-8">
      <PageHeader
        title="Librarian Dashboard"
        subtitle="Manage lending, returns, and catalog operations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw size={14} />}
              aria-label="Refresh dashboard"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setReturnModal(true)}
              icon={<RotateCcw size={15} />}
            >
              Process Return
            </Button>
            <Button
              onClick={() => setIssueModal(true)}
              icon={<Plus size={15} />}
            >
              Issue Book
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className={`stat-icon ${stat.iconClass}`}>
                  <stat.icon size={20} aria-hidden="true" />
                </div>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
      </div>

      {/* Recent transactions */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100">
          <CardTitle>Recent Transactions</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" aria-label="Recent lending transactions">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Book</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)
              ) : !stats?.recent_transactions?.length ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<BookOpen size={22} />}
                      title="No transactions yet"
                      className="py-8"
                    />
                  </td>
                </tr>
              ) : (
                stats.recent_transactions.map((txn: {
                  transaction_id: string;
                  created_at: string;
                  member_name: string;
                  title: string;
                  status: string;
                  due_date: string;
                }) => (
                  <tr key={txn.transaction_id}>
                    <td className="text-slate-500 text-xs">{formatDate(txn.created_at)}</td>
                    <td className="font-medium text-slate-900">{txn.member_name}</td>
                    <td className="max-w-xs">
                      <span className="line-clamp-1 text-slate-700">{txn.title}</span>
                    </td>
                    <td><StatusBadge status={txn.status} /></td>
                    <td className="text-slate-500 text-xs">{formatDate(txn.due_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Modal */}
      <Modal
        isOpen={issueModal}
        onClose={() => setIssueModal(false)}
        title="Issue Book"
        description="Enter the catalog item ID and member ID to issue a book."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Catalog ID"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            placeholder="e.g. 3f2a1b4c-…"
            required
            hint="The UUID of the catalog item"
          />
          <Input
            label="Member ID"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="e.g. a1b2c3d4-…"
            required
            hint="The UUID of the member's user account"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIssueModal(false)}>Cancel</Button>
            <Button onClick={handleIssue} loading={isIssuing}>Issue Book</Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={returnModal}
        onClose={() => setReturnModal(false)}
        title="Process Return"
        description="Enter the transaction ID to process a book return."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. 9f8e7d6c-…"
            required
            hint="The UUID of the lending transaction"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setReturnModal(false)}>Cancel</Button>
            <Button onClick={handleReturn} loading={isReturning}>Process Return</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
