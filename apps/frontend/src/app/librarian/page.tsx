"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, RotateCcw, Clock, Banknote, Plus, RefreshCw, Edit2, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLibrarianDashboard, useIssueBook, useReturnBook, useOverdueTransactions, useAdjustFine, useWaiveFine } from "@/features/library/hooks/useLibrary";
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

  const { data: stats, isLoading, refetch } = useLibrarianDashboard();
  const { data: overdueData, isLoading: overdueLoading, refetch: refetchOverdue } = useOverdueTransactions();
  const { mutateAsync: issueBook, isPending: isIssuing } = useIssueBook();
  const { mutateAsync: returnBook, isPending: isReturning } = useReturnBook();
  const { mutateAsync: adjustFine, isPending: isAdjusting } = useAdjustFine();
  const { mutateAsync: waiveFine, isPending: isWaiving } = useWaiveFine();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [catalogId, setCatalogId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedFineId, setSelectedFineId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

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

  const handleAdjustFine = async () => {
    if (!selectedFineId || !newAmount.trim() || !adjustReason.trim()) {
      toast.error("All fields are required");
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await adjustFine({
        fine_id: selectedFineId,
        amount,
        reason: adjustReason.trim(),
      });
      toast.success("Fine adjusted successfully");
      setAdjustModal(false);
      setSelectedFineId(null);
      setNewAmount("");
      setAdjustReason("");
      refetchOverdue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to adjust fine");
    }
  };

  const handleWaiveFine = async (fineId: string) => {
    try {
      await waiveFine(fineId);
      toast.success("Fine waived successfully");
      refetchOverdue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to waive fine");
    }
  };


  const statCards = [
    { label: "On Loan", value: stats?.on_loan ?? 0, icon: BookOpen, iconClass: "bg-primary/15 text-primary" },
    {
      label: "Overdue",
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      iconClass: (stats?.overdue ?? 0) > 0 ? "bg-error/15 text-error" : "bg-surface-container-high text-on-surface-variant",
    },
    { label: "Returns Today", value: stats?.returns_today ?? 0, icon: RotateCcw, iconClass: "bg-tertiary/15 text-tertiary" },
    {
      label: "Holds Pending",
      value: stats?.holds_pending ?? 0,
      icon: Clock,
      iconClass: "bg-secondary-container text-on-secondary-container",
    },
    {
      label: "Fines (Tk)",
      value: (stats?.total_fines_amount ?? 0).toFixed(0),
      icon: Banknote,
      iconClass: "bg-error/10 text-error",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-8">
      <PageHeader
        title="Librarian Dashboard"
        subtitle="Manage lending, returns, and catalog operations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                refetchOverdue();
              }}
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

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-outline-variant">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "overdue"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Overdue & Fines
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
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
            <div className="px-6 py-4 border-b border-outline-variant">
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
                        <td className="text-on-surface-variant text-xs">{formatDate(txn.created_at)}</td>
                        <td className="font-medium text-on-surface">{txn.member_name}</td>
                        <td className="max-w-xs">
                          <span className="line-clamp-1 text-on-surface">{txn.title}</span>
                        </td>
                        <td><StatusBadge status={txn.status} /></td>
                        <td className="text-on-surface-variant text-xs">{formatDate(txn.due_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Overdue & Fines Tab */}
      {activeTab === "overdue" && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-outline-variant">
            <CardTitle>Overdue Items & Fines</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Overdue items and fines">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Fine Amount (Tk)</th>
                  <th>Fine Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
                ) : !overdueData?.length ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<AlertTriangle size={22} />}
                        title="No overdue items"
                        description="All books are returned on time!"
                        className="py-8"
                      />
                    </td>
                  </tr>
                ) : (
                  overdueData.map((item: {
                    transaction_id: string;
                    member_name: string;
                    title: string;
                    due_date: string;
                    days_overdue: number;
                    fine_amount: number;
                    fine_id: string;
                    fine_status: string;
                  }) => (
                    <tr key={`${item.transaction_id}-${item.fine_id}`}>
                      <td className="font-medium text-on-surface">{item.member_name}</td>
                      <td className="max-w-xs">
                        <span className="line-clamp-1 text-on-surface">{item.title}</span>
                      </td>
                      <td className="text-on-surface-variant text-sm">{formatDate(item.due_date)}</td>
                      <td className="text-red-600 font-medium">{item.days_overdue} days</td>
                      <td className="text-orange-600 font-medium">{item.fine_amount.toFixed(2)}</td>
                      <td><StatusBadge status={item.fine_status} /></td>
                      <td className="text-sm flex gap-2">
                        {item.fine_status !== "waived" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFineId(item.fine_id);
                                setNewAmount(item.fine_amount.toString());
                                setAdjustReason("");
                                setAdjustModal(true);
                              }}
                              icon={<Edit2 size={13} />}
                              aria-label="Adjust fine"
                            >
                              Adjust
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWaiveFine(item.fine_id)}
                              loading={isWaiving}
                              aria-label="Waive fine"
                            >
                              Waive
                            </Button>
                          </>
                        )}
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
        onClose={() => {
          setAdjustModal(false);
          setSelectedFineId(null);
          setNewAmount("");
          setAdjustReason("");
        }}
        title="Adjust Fine"
        description="Set a custom fine amount with a recorded reason."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Fine Amount (Tk)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="e.g. 150"
            step="0.01"
            min="0"
            required
          />
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Reason for Adjustment</label>
            <textarea
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Waived due to hardship, Adjusted due to error..."
              required
              rows={3}
              className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAdjustModal(false);
                setSelectedFineId(null);
                setNewAmount("");
                setAdjustReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustFine} loading={isAdjusting}>
              Adjust Fine
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

