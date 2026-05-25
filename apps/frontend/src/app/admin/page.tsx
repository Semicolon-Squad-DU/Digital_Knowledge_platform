"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, FileText, RefreshCw,
  Pencil, Trash2, Eye, EyeOff, Filter, ChevronLeft, ChevronRight,
  BookMarked, Users, HardDrive, AlertCircle, Bell, Heart, Search,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useAdminStats, useCatalogDocuments, useResearcherSubmissions } from "@/hooks/useAdmin";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo, cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Status pill colors ────────────────────────────────────────────────────────
const PILL: Record<string, {bg:string; color:string}> = {
  published:       { bg:"#e6f4ea", color:"#1e7e34" },
  success:         { bg:"#e6f4ea", color:"#1e7e34" },
  active:          { bg:"#e6f4ea", color:"#1e7e34" },
  approved:        { bg:"#e6f4ea", color:"#1e7e34" },
  pending:         { bg:"#e8f0fe", color:"#1a56db" },
  pending_review:  { bg:"#e8f0fe", color:"#1a56db" },
  review:          { bg:"#e8f0fe", color:"#1a56db" },
  error:           { bg:"#fde8e8", color:"#c81e1e" },
  overdue:         { bg:"#fde8e8", color:"#c81e1e" },
  blocked:         { bg:"#fde8e8", color:"#c81e1e" },
  draft:           { bg:"#f3f4f6", color:"#6b7280" },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{size?: number}>;
  color?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color = "#2563eb", loading = false }: StatCardProps) {
  const isGradient = color.includes("gradient");
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

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Use appropriate data based on user role
  const documentsData = user?.role === "researcher" ? researchSubmissionsData : catalogDocsData;
  const docsLoading = user?.role === "researcher" ? researchLoading : catalogDocsLoading;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check if user is librarian, admin, or researcher
    if (!["librarian", "admin", "researcher"].includes(user?.role ?? "")) {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Data refreshed");
  };

  const handleDelete = (id: string) => {
    // Will be called with mutation
    toast.success("Document removed");
  };

  const handleToggleAccess = (id: string) => {
    // Will be called with mutation
    toast.success("Access level updated");
  };

  if (!isAuthenticated) return null;

  const roleTitle = {
    librarian: "Librarian Oversight",
    admin: "Platform Administration",
    researcher: "My Submissions",
    member: "Member Dashboard",
    student: "Student Portal",
    archivist: "Archive Management",
  }[user?.role ?? "librarian"] || "Admin Panel";

  const roleDescription = {
    librarian: "Manage academic documents, verify metadata, and control platform access permissions.",
    admin: "Monitor platform activity, manage users, and system configuration.",
    researcher: "View and manage your research submissions under review.",
    member: "Manage your contributions and submissions.",
    student: "View your learning resources and submissions.",
    archivist: "Oversee digital archives and preservation tasks.",
  }[user?.role ?? "librarian"] || "Admin panel for platform management";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb" }}>
      <DashboardSidebar />

      {/* ── MAIN ── */}
      <div style={{ marginLeft: 200, flex: 1, display: "flex", flexDirection: "column" }}>
        <DashboardHeader showSearch={false} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Link href="/notifications" style={{
              position: "relative", width: 36, height: 36, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", cursor: "pointer",
              textDecoration: "none",
            }}>
              <Bell size={18} color="#6b7280" />
            </Link>
            <Link href="/library/wishlist" style={{
              width: 36, height: 36, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none",
            }}>
              <Heart size={18} color="#6b7280" />
            </Link>
            <Link href="/profile" style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#4b5563",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
              overflow: "hidden",
              textDecoration: "none",
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </Link>
          </div>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {/* ── Page heading ── */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
              {roleTitle}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {roleDescription}
            </p>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: user?.role === "researcher" ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {user?.role === "researcher" ? (
              // Researchers: Only show their pending submissions
              <StatCard
                label="My Submissions Under Review"
                value={statsLoading ? "—" : adminStats?.pendingReview ?? 0}
                sub={adminStats?.pendingReview ? "awaiting decision" : "all approved"}
                icon={AlertCircle}
                color="#dc2626"
                loading={statsLoading}
              />
            ) : (
              // Librarians/Admins: Show 3 stat cards (no pending review)
              <>
                <StatCard
                  label="Total Documents"
                  value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()}
                  sub={adminStats?.totalDocuments ? `Archive & Library combined` : undefined}
                  icon={FileText}
                  color="linear-gradient(135deg, #4b5563, #d1d5db)"
                  loading={statsLoading}
                />
                <StatCard
                  label="Active Users"
                  value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()}
                  sub={adminStats?.activeUsers ? "online this month" : undefined}
                  icon={Users}
                  color="linear-gradient(135deg, #4b5563, #d1d5db)"
                  loading={statsLoading}
                />
                <StatCard
                  label="Storage Used"
                  value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 0}%`}
                  sub={adminStats ? "of total capacity" : undefined}
                  icon={HardDrive}
                  color="linear-gradient(135deg, #4b5563, #d1d5db)"
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
                background: (filterStatus !== "all" || searchQuery) ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
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
                      background: page === currentPage ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
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
        </main>
      </div>
    </div>
  );
}
