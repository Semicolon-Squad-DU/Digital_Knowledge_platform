"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, RefreshCw,
  Pencil, Trash2, Eye, EyeOff, Filter, ChevronLeft, ChevronRight,
  Users, HardDrive, AlertCircle, Search, BookOpen,
  Lock, Check, X
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useAdminStats, useCatalogDocuments, useResearcherSubmissions, useArchiveDocuments } from "@/hooks/useAdmin";
import { useBorrowingHistory, useMemberHolds, useMemberFines } from "@/hooks/useLibrary";
import { usePendingAccessRequests, useReviewAccessRequest } from "@/hooks/useArchive";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

// ── Status pill colors ────────────────────────────────────────────────────────
const PILL: Record<string, { bg: string; color: string }> = {
  published: { bg: "#e6f4ea", color: "#1e7e34" },
  success: { bg: "#e6f4ea", color: "#1e7e34" },
  active: { bg: "#e6f4ea", color: "#1e7e34" },
  approved: { bg: "#e6f4ea", color: "#1e7e34" },
  pending: { bg: "#e8f0fe", color: "#1a56db" },
  pending_review: { bg: "#e8f0fe", color: "#1a56db" },
  review: { bg: "#e8f0fe", color: "#1a56db" },
  error: { bg: "#fde8e8", color: "#c81e1e" },
  overdue: { bg: "#fde8e8", color: "#c81e1e" },
  blocked: { bg: "#fde8e8", color: "#c81e1e" },
  draft: { bg: "#f3f4f6", color: "#6b7280" },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color = "#2563eb", loading = false }: StatCardProps) {
  const isGradient = color.includes("gradient") || color.startsWith("var(");
  const iconColor = isGradient ? "#ffffff" : color;
  const bgStyle = isGradient ? color : color + "15";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "20px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        background: bgStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={24} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, margin: 0, letterSpacing: "0.5px" }}>
          {label.toUpperCase()}
        </p>
        {loading ? (
          <Skeleton className="h-6 w-24 mt-2" />
        ) : (
          <>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "6px 0 0" }}>
              {value}
            </p>
            {sub && (
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                {sub}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Admin Dashboard Page ───────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Check if logged in user is a student
  const isStudent = ["student", "student_author"].includes(user?.role ?? "");
  const memberId = user?.user_id ?? "";

  // Fetch real data from backend
  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: catalogDocsData, isLoading: catalogDocsLoading } = useCatalogDocuments({
    page: currentPage,
    limit: 10,
    search: searchQuery,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const { data: researchSubmissionsData, isLoading: researchLoading } = useResearcherSubmissions({
    page: currentPage,
    limit: 10,
    search: searchQuery,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const { data: archiveDocsData, isLoading: archiveLoading } = useArchiveDocuments({
    page: currentPage,
    limit: 10,
    search: searchQuery,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  // Fetch student library data
  const { data: borrowHistory, isLoading: borrowLoading } = useBorrowingHistory(memberId);
  const { data: memberHolds, isLoading: holdsLoading } = useMemberHolds(memberId);
  const { data: finesData, isLoading: finesLoading } = useMemberFines(memberId);

  // Fetch pending access requests if archivist or admin
  const isArchivistOrAdmin = ["archivist", "admin"].includes(user?.role ?? "");
  const { data: pendingRequests, refetch: refetchRequests } = usePendingAccessRequests();
  const { mutateAsync: reviewRequest } = useReviewAccessRequest();

  // Combine borrow and hold history for unified student view
  const combinedItems = [];
  if (borrowHistory) combinedItems.push(...borrowHistory);
  if (memberHolds) combinedItems.push(...memberHolds);

  // Sort combined library items by date (newest first)
  combinedItems.sort((a: any, b: any) => {
    const dateA = new Date(a.request_date || a.issue_date || a.created_at).getTime();
    const dateB = new Date(b.request_date || b.issue_date || b.created_at).getTime();
    return dateB - dateA;
  });

  // Filter combined library items by search query
  const filteredCombinedItems = combinedItems.filter((item: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(query);
    const authorMatch = Array.isArray(item.authors)
      ? item.authors.join(", ").toLowerCase().includes(query)
      : (typeof item.authors === "string" ? item.authors.toLowerCase().includes(query) : false);
    const isbnMatch = item.isbn?.toLowerCase().includes(query);
    return titleMatch || authorMatch || isbnMatch;
  });

  // Calculate statistics for student view
  const activeLoansCount = borrowHistory?.filter((t: any) => t.status === "active" || t.status === "overdue").length ?? 0;
  const activeHoldsCount = memberHolds?.filter((h: any) => h.status === "pending" || h.status === "available").length ?? 0;

  // Use appropriate data based on user role
  const documentsData =
    user?.role === "researcher"
      ? researchSubmissionsData
      : user?.role === "archivist"
      ? archiveDocsData
      : catalogDocsData;

  const docsLoading =
    isStudent
      ? (borrowLoading || holdsLoading || finesLoading)
      : (user?.role === "researcher"
      ? researchLoading
      : user?.role === "archivist"
      ? archiveLoading
      : catalogDocsLoading);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect librarians to librarian portal
    if (user?.role === "librarian") {
      router.push("/librarian");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: ["archive"] });
    toast.success("Data refreshed");
  };

  const handleDelete = (id: string) => {
    toast.success("Document removed");
  };

  const handleToggleAccess = (id: string) => {
    toast.success("Access level updated");
  };

  if (!isAuthenticated || user?.role === "librarian") return null;

  const roleTitle = isStudent
    ? "Admin panel"
    : ({
        admin: "Platform Administration",
        researcher: "My Submissions",
        member: "Member Dashboard",
        student: "Student Portal",
        student_author: "Student Submissions",
        archivist: "Archive Management",
      } as Record<string, string>)[user?.role ?? "admin"] || "Admin Panel";

  const roleDescription = isStudent
    ? "View your borrowed books, active reservations, loan durations, and pending fines."
    : ({
        admin: "Monitor platform activity, manage users, and system configuration.",
        researcher: "View and manage your research submissions under review.",
        member: "Manage your contributions and submissions.",
        student: "View your learning resources and submissions.",
        student_author: "Submit and track academic and student projects.",
        archivist: "Oversee digital archives and preservation tasks.",
      } as Record<string, string>)[user?.role ?? "admin"] || "Admin panel for platform management";

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px" }}>
        {/* ── Page heading ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2, fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {roleTitle}
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            {roleDescription}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: user?.role === "researcher" ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {isStudent ? (
            <>
              <StatCard
                label="Borrowed Books"
                value={docsLoading ? "—" : activeLoansCount}
                sub="currently borrowed"
                icon={BookOpen}
                color="var(--theme-gradient-135)"
                loading={docsLoading}
              />
              <StatCard
                label="Reserved Books"
                value={docsLoading ? "—" : activeHoldsCount}
                sub="active holds / reservations"
                icon={HardDrive}
                color="var(--theme-gradient-135)"
                loading={docsLoading}
              />
              <StatCard
                label="Total Fines"
                value={docsLoading ? "—" : `${finesData?.total_pending ?? 0} TK`}
                sub="flat 100 TK fine for overdue books"
                icon={AlertCircle}
                color={(finesData?.total_pending ?? 0) > 0 ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "var(--theme-gradient-135)"}
                loading={docsLoading}
              />
            </>
          ) : user?.role === "researcher" ? (
            <StatCard
              label="My Submissions Under Review"
              value={statsLoading ? "—" : adminStats?.pendingReview ?? 0}
              sub={adminStats?.pendingReview ? "awaiting decision" : "all approved"}
              icon={AlertCircle}
              color="#dc2626"
              loading={statsLoading}
            />
          ) : (
            <>
              <StatCard
                label="Total Documents"
                value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()}
                sub={adminStats?.totalDocuments ? `Archive & Library combined` : undefined}
                icon={FileText}
                color="var(--theme-gradient-135)"
                loading={statsLoading}
              />
              <StatCard
                label="Active Users"
                value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()}
                sub={adminStats?.activeUsers ? "online this month" : undefined}
                icon={Users}
                color="var(--theme-gradient-135)"
                loading={statsLoading}
              />
              <StatCard
                label="Storage Used"
                value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 0}%`}
                sub={adminStats ? "of total capacity" : undefined}
                icon={HardDrive}
                color="var(--theme-gradient-135)"
                loading={statsLoading}
              />
            </>
          )}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          justifyContent: "space-between",
        }}>
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <Search size={14} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search by title, author, or DOI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#1f2937",
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={() => {
              setFilterStatus("all");
              setSearchQuery("");
              setCurrentPage(1);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              background: (filterStatus !== "all" || searchQuery) ? "var(--theme-gradient-160)" : "#fff",
              border: (filterStatus !== "all" || searchQuery) ? "none" : "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: (filterStatus !== "all" || searchQuery) ? "#fff" : "#6b7280",
            }}
          >
            <Filter size={14} />
            {(filterStatus !== "all" || searchQuery) ? "Clear" : "Filter"}
          </button>
          <button
            onClick={handleRefresh}
            style={{
              width: 36,
              height: 36,
              padding: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={14} color="#6b7280" />
          </button>
        </div>

        {/* ── Restricted Document Access Requests (Only for Archivist/Admin) ── */}
        {isArchivistOrAdmin && pendingRequests && pendingRequests.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={16} /> Restricted Document Access Requests ({pendingRequests.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingRequests.map((req: any) => (
                <div key={req.request_id} style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      Request by: <span style={{ color: "#2563eb" }}>{req.user_name}</span> ({req.user_email})
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
                      Document: <strong style={{ color: "#111827" }}>{req.item_title}</strong>
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280", fontStyle: "italic", background: "#f9fafb", padding: "6px 10px", borderRadius: 6, borderLeft: "3px solid #2563eb" }}>
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        try {
                          await reviewRequest({ requestId: req.request_id, status: "approved" });
                          toast.success("Access request approved successfully!");
                          refetchRequests();
                        } catch {
                          toast.error("Failed to approve access request");
                        }
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#16a34a",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await reviewRequest({ requestId: req.request_id, status: "denied" });
                          toast.success("Access request denied successfully!");
                          refetchRequests();
                        } catch {
                          toast.error("Failed to deny access request");
                        }
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "1px solid #fca5a5",
                        background: "#fee2e2",
                        color: "#991b1b",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <X size={12} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Library policy notice banner (only for student) ── */}
        {isStudent && (
          <div style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)",
            border: "1px solid #fca5a5",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          }}>
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 500, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>Library Policy Notice:</span> Books must be returned within the designated time duration. If a student does not return a book on time, a flat fine of <span style={{ fontWeight: 700, color: "#b91c1c" }}>100 TK</span> will be charged per overdue book.
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {docsLoading ? (
            <div style={{ padding: "32px 24px" }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 mb-3" />
              ))}
            </div>
          ) : isStudent ? (
            // ── STUDENT VIEW TABLE ──
            !filteredCombinedItems || filteredCombinedItems.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}>
                <p>No borrowed or reserved books found</p>
              </div>
            ) : (
              <>
                {/* ── Table Header ── */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr",
                  gap: 16,
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "14px 20px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.5px",
                }}>
                  <div>BOOK TITLE / DETAILS</div>
                  <div>TRANSACTION TYPE</div>
                  <div>STATUS</div>
                  <div>TIME DURATION</div>
                  <div style={{ textAlign: "right" }}>FINE AMOUNT</div>
                </div>

                {/* ── Table Rows ── */}
                {filteredCombinedItems.map((item: any) => {
                  const isHold = 'hold_id' in item;
                  const statusText = item.status;
                  
                  // Get pill colors based on transaction status
                  let pillStyle = { bg: "#f3f4f6", color: "#6b7280" };
                  if (statusText === 'active') pillStyle = { bg: "#e6f4ea", color: "#1e7e34" }; // Active Borrow
                  else if (statusText === 'overdue') pillStyle = { bg: "#fde8e8", color: "#c81e1e" }; // Overdue
                  else if (statusText === 'returned') pillStyle = { bg: "#f3f4f6", color: "#6b7280" }; // Returned
                  else if (statusText === 'pending') pillStyle = { bg: "#e8f0fe", color: "#1a56db" }; // Reserved (Pending)
                  else if (statusText === 'available') pillStyle = { bg: "#e6f4ea", color: "#1e7e34" }; // Reserved (Available)

                  // Time Duration text
                  let durationText = "";
                  if (isHold) {
                    durationText = `Reserved on ${new Date(item.request_date).toLocaleDateString()}`;
                  } else {
                    const issueStr = new Date(item.issue_date).toLocaleDateString();
                    const dueStr = new Date(item.due_date).toLocaleDateString();
                    if (item.status === 'returned' && item.return_date) {
                      durationText = `Issued: ${issueStr} | Returned: ${new Date(item.return_date).toLocaleDateString()}`;
                    } else {
                      durationText = `Issued: ${issueStr} | Due: ${dueStr}`;
                    }
                  }

                  // Fine amount
                  let fineDisplay = "—";
                  if (item.status === 'overdue') {
                    fineDisplay = "100 TK";
                  }

                  return (
                    <div
                      key={isHold ? item.hold_id : item.transaction_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr",
                        gap: 16,
                        alignItems: "center",
                        padding: "16px 20px",
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: 13,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Book title and authors */}
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#1f2937", lineHeight: 1.4 }}>
                          {item.title}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                          {Array.isArray(item.authors) ? item.authors.join(", ") : (typeof item.authors === 'string' ? item.authors : "Unknown Author")}
                        </p>
                      </div>

                      {/* Transaction type */}
                      <div style={{ fontWeight: 500, color: "#4b5563" }}>
                        {isHold ? "Reservation" : "Borrow"}
                      </div>

                      {/* Status Pill */}
                      <div>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          background: pillStyle.bg,
                          color: pillStyle.color,
                        }}>
                          {item.status}
                        </span>
                      </div>

                      {/* Time Duration */}
                      <div style={{ color: "#374151", fontWeight: 500 }}>
                        {durationText}
                      </div>

                      {/* Fine */}
                      <div style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: item.status === 'overdue' ? "#dc2626" : "#6b7280"
                      }}>
                        {fineDisplay}
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : !documentsData?.items || documentsData.items.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}>
              <p>No documents found</p>
            </div>
          ) : (
            <>
              {/* ── Table Header ── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.8fr",
                gap: 16,
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                padding: "14px 20px",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.5px",
              }}>
                <div>{user?.role === "researcher" ? "SUBMISSION TITLE" : "DOCUMENT DETAIL"}</div>
                <div>{user?.role === "researcher" ? "TYPE / COLLABORATORS" : "AUTHOR / FACULTY"}</div>
                <div>STATUS</div>
                <div>LAST MODIFIED</div>
                <div>ACCESS</div>
                <div style={{ textAlign: "center" }}>ACTIONS</div>
              </div>

              {/* ── Table Rows ── */}
              {documentsData.items.map((doc: any) => {
                const statusStyle = PILL[doc.status] || PILL.draft;
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.8fr",
                      gap: 16,
                      alignItems: "center",
                      padding: "16px 20px",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  >
                    {/* Document Title */}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: "#1f2937", lineHeight: 1.4 }}>
                        {doc.title}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                        {doc.download_count || 0} downloads
                      </p>
                    </div>

                    {/* Author */}
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: "#374151" }}>
                        {typeof doc.authors === 'string' ? doc.authors : (Array.isArray(doc.authors) ? doc.authors.join(", ") : "Unknown")}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
                        {doc.department || "—"}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        textTransform: "capitalize",
                      }}>
                        {doc.status}
                      </span>
                    </div>

                    {/* Last Modified */}
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "—"}
                    </div>

                    {/* Access */}
                    <div>
                      <button
                        onClick={() => handleToggleAccess(doc.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 4,
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#6b7280",
                          textTransform: "capitalize",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                        }}
                      >
                        {doc.access === "public" ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                        {doc.access}
                      </button>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}>
                      <button style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                        }}
                      >
                        <Pencil size={12} color="#2563eb" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 4,
                          border: "1px solid #fecaca",
                          background: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                        }}
                      >
                        <Trash2 size={12} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isStudent && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
            fontSize: 13,
            color: "#6b7280",
          }}>
            <span>
              Showing {documentsData ? (currentPage - 1) * 10 + 1 : 0} to {documentsData ? Math.min(currentPage * 10, documentsData.total) : 0} of {documentsData?.total || 0} entries
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} color="#6b7280" />
              </button>
              {[...Array(Math.min(5, Math.ceil((documentsData?.total || 1) / 10)))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      border: page === currentPage ? "none" : "1px solid #e5e7eb",
                      background: page === currentPage ? "var(--avatar-theme-color)" : "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      color: page === currentPage ? "#fff" : "#6b7280",
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!documentsData || currentPage >= Math.ceil(documentsData.total / 10)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: !documentsData || currentPage >= Math.ceil(documentsData.total / 10) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: !documentsData || currentPage >= Math.ceil(documentsData.total / 10) ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} color="#6b7280" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
