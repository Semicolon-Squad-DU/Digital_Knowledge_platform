"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, RotateCcw, Clock, Banknote, Plus, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLibrarianDashboard, useIssueBook, useReturnBook, useOverdueItems, useWaiveFine, useAdjustFine } from "@/hooks/useLibrary";
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

type Tab = "overview" | "overdue";

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !["librarian", "admin"].includes(user?.role ?? "")) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: stats, isLoading, refetch } = useLibrarianDashboard();
  const { data: overdueData, isLoading: overdueLoading, refetch: refetchOverdue } = useOverdueItems();
  const { mutateAsync: issueBook, isPending: isIssuing } = useIssueBook();
  const { mutateAsync: returnBook, isPending: isReturning } = useReturnBook();
  const { mutateAsync: waiveFine, isPending: isWaiving } = useWaiveFine();
  const { mutateAsync: adjustFine, isPending: isAdjusting } = useAdjustFine();

  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustFineId, setAdjustFineId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
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

  const handleWaiveFine = async (fineId: string) => {
    try {
      await waiveFine(fineId);
      toast.success("Fine waived");
      refetchOverdue();
    } catch {
      toast.error("Failed to waive fine");
    }
  };

  const openAdjustModal = (fineId: string) => {
    setAdjustFineId(fineId);
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustModal(true);
  };

  const handleAdjustFine = async () => {
    if (!adjustAmount || !adjustReason.trim()) {
      toast.error("Amount and reason are required");
      return;
    }
    try {
      await adjustFine({ fineId: adjustFineId, amount: parseFloat(adjustAmount), reason: adjustReason.trim() });
      toast.success("Fine adjusted");
      setAdjustModal(false);
      refetchOverdue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to adjust fine");
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
              onClick={() => { refetch(); refetchOverdue(); }}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {(["overview", "overdue"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "overview" ? "Recent Transactions" : "Overdue & Fines"}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
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
      )}

      {/* Overdue & Fines tab */}
      {activeTab === "overdue" && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <CardTitle>Overdue Items &amp; Fines</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetchOverdue()} icon={<RefreshCw size={14} />}>
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Overdue items and fines">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Fine (Tk)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
                ) : !overdueData?.length ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<AlertTriangle size={22} />}
                        title="No overdue items"
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  overdueData.map((item: {
                    transaction_id: string;
                    member_name: string;
                    book_title: string;
                    due_date: string;
                    days_overdue: number;
                    current_fine: number;
                    fine_id?: string;
                  }) => (
                    <tr key={item.transaction_id}>
                      <td className="font-medium text-slate-900">{item.member_name}</td>
                      <td className="max-w-xs"><span className="line-clamp-1 text-slate-700">{item.book_title}</span></td>
                      <td className="text-slate-500 text-xs">{formatDate(item.due_date)}</td>
                      <td>
                        <span className="text-red-600 font-semibold">{item.days_overdue}</span>
                      </td>
                      <td className="font-medium text-slate-900">
                        {Number(item.current_fine).toFixed(2)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {item.fine_id && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWaiveFine(item.fine_id!)}
                                loading={isWaiving}
                              >
                                Waive
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAdjustModal(item.fine_id!)}
                                loading={isAdjusting}
                              >
                                Adjust
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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

      {/* Adjust Fine Modal */}
      <Modal
        isOpen={adjustModal}
        onClose={() => setAdjustModal(false)}
        title="Adjust Fine"
        description="Set a custom fine amount and provide a reason."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Amount (Tk)"
            type="number"
            min="0"
            step="0.01"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="e.g. 25.00"
            required
          />
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              rows={3}
              placeholder="Reason for adjustment"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAdjustModal(false)}>Cancel</Button>
            <Button onClick={handleAdjustFine} loading={isAdjusting}>Save Adjustment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

