"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Archive, Send, BookOpen, ShieldCheck, FlaskConical,
  Bell, Heart, Search, Plus, Upload, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useArchiveSearch, useDownloadArchiveItem } from "@/hooks/useArchive";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { UploadModal } from "@/components/archive/UploadModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Sidebar Navigation ────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },
  { label: "Research",    href: "/research",  icon: FlaskConical },
  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: BookOpen },
  { label: "Admin",       href: "/admin",     icon: ShieldCheck },
];

const CATEGORY_OPTIONS = [
  "General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other"
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
];

const FILE_TYPE_OPTIONS = [
  { value: "application/pdf", label: "PDF" },
  { value: "image/jpeg", label: "Image" },
  { value: "audio/mpeg", label: "Audio" },
  { value: "video/mp4", label: "Video" },
];

export default function ArchivePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [params, setParams] = useState({
    query: "", category: "", language: "", file_type: "", page: 1, limit: 20,
  });

  const { data, isLoading, isError } = useArchiveSearch(params);
  const { mutateAsync: download } = useDownloadArchiveItem();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const canUpload = isAuthenticated && ["archivist", "admin"].includes(user?.role ?? "");
  const unreadCount = notifData?.unread_count ?? 0;

  const handleSearch = () => {
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterApply = () => {
    setParams((p) => ({
      ...p,
      category: filterCategory,
      language: filterLanguage,
      file_type: filterFileType,
      page: 1,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilterCategory("");
    setFilterLanguage("");
    setFilterFileType("");
    setParams({ query: "", category: "", language: "", file_type: "", page: 1, limit: 20 });
    setCurrentPage(1);
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await download(id);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  const hasActiveFilters = filterCategory || filterLanguage || filterFileType || searchInput;

  if (!isAuthenticated) return null;

  const totalPages = data?.total_pages || 1;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: 200,
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        position: "fixed",
        height: "100vh",
        overflowY: "auto",
        top: 0,
        left: 0,
        zIndex: 40,
      }}>
        <div style={{ padding: "20px 12px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 20px 0", letterSpacing: "-0.5px" }}>
            DKP
          </h2>
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/archive";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: isActive ? "#f3f4f6" : "transparent",
                    color: isActive ? "#111827" : "#6b7280",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ marginLeft: 200, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* ── Header ── */}
        <div style={{
          height: 60,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: 20,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, marginLeft: 20 }}>
            Digital Archive
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/notifications" style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              textDecoration: "none",
            }}>
              <Bell size={18} color="#6b7280" />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  background: "#dc2626",
                  borderRadius: "50%",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/library/wishlist" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              textDecoration: "none",
            }}>
              <Heart size={18} color="#6b7280" />
            </Link>
            <Link href="/profile" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "#e5e7eb",
              cursor: "pointer",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
              color: "#4b5563",
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        {/* ── Main Area ── */}
        <main style={{
          flex: 1,
          padding: "28px 32px",
          overflowY: "auto",
        }}>
          {/* Title Section */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>
              Search & Browse
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0 0" }}>
              Find institutional documents and media
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}>
            <div style={{
              flex: 1,
              minWidth: 300,
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
                placeholder="Search documents..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              onClick={handleSearch}
              style={{
                padding: "10px 16px",
                background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Search size={14} />
              Search
            </button>
            {canUpload && (
              <button
                onClick={() => setUploadOpen(true)}
                style={{
                  padding: "10px 16px",
                  background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Upload size={14} />
                Upload
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            {/* Category Chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Category:
              </span>
              <button
                onClick={() => setFilterCategory("")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: filterCategory === "" ? "none" : "1px solid #e5e7eb",
                  background: filterCategory === "" ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                  color: filterCategory === "" ? "#fff" : "#6b7280",
                  fontSize: 12,
                  fontWeight: filterCategory === "" ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                All
              </button>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: filterCategory === cat ? "none" : "1px solid #e5e7eb",
                    background: filterCategory === cat ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                    color: filterCategory === cat ? "#fff" : "#6b7280",
                    fontSize: 12,
                    fontWeight: filterCategory === cat ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Language Chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Language:
              </span>
              <button
                onClick={() => setFilterLanguage("")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: filterLanguage === "" ? "none" : "1px solid #e5e7eb",
                  background: filterLanguage === "" ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                  color: filterLanguage === "" ? "#fff" : "#6b7280",
                  fontSize: 12,
                  fontWeight: filterLanguage === "" ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                All
              </button>
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setFilterLanguage(lang.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: filterLanguage === lang.value ? "none" : "1px solid #e5e7eb",
                    background: filterLanguage === lang.value ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                    color: filterLanguage === lang.value ? "#fff" : "#6b7280",
                    fontSize: 12,
                    fontWeight: filterLanguage === lang.value ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* File Type Chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Type:
              </span>
              <button
                onClick={() => setFilterFileType("")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: filterFileType === "" ? "none" : "1px solid #e5e7eb",
                  background: filterFileType === "" ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                  color: filterFileType === "" ? "#fff" : "#6b7280",
                  fontSize: 12,
                  fontWeight: filterFileType === "" ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                All
              </button>
              {FILE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterFileType(type.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: filterFileType === type.value ? "none" : "1px solid #e5e7eb",
                    background: filterFileType === type.value ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                    color: filterFileType === type.value ? "#fff" : "#6b7280",
                    fontSize: 12,
                    fontWeight: filterFileType === type.value ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Apply Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: "8px 12px",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Results Info */}
          {!isLoading && data && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
              {data.total.toLocaleString()} result{data.total !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div style={{
              padding: 16,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              fontSize: 13,
            }}>
              Failed to load results. Please try again.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!data || data.items.length === 0) && (
            <EmptyState
              icon={<Archive size={32} />}
              title="No documents found"
              description={hasActiveFilters ? "Try adjusting your filters or search terms." : "No documents have been published yet."}
            />
          )}

          {/* Results Grid */}
          {!isLoading && data && data.items.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}>
                {data.items.map((item: any) => (
                  <ArchiveCard
                    key={item.item_id}
                    item={item}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 24,
                }}>
                  <button
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1));
                      setParams((p) => ({ ...p, page: Math.max(1, currentPage - 1) }));
                    }}
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
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          setParams((p) => ({ ...p, page }));
                        }}
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
                    onClick={() => {
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                      setParams((p) => ({ ...p, page: Math.min(totalPages, currentPage + 1) }));
                    }}
                    disabled={currentPage >= totalPages}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: currentPage >= totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={14} color="#6b7280" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
