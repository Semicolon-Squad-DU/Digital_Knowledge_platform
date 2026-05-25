"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Heart, BookMarked, ArrowLeft, Pencil, Trash2,
  Building2, Calendar, Hash, Layers,
  MapPin, Copy, CheckCircle, Clock, FileText, Plus, Minus,
  LayoutDashboard, Archive, Send, Library, ShieldCheck,
  Bell, Search, Download, Share2, FileJson, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  useCatalogItem, useAddToWishlist, usePlaceHold,
  useUpdateCatalogItem, useDeleteCatalogItem,
} from "@/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CatalogItem {
  catalog_id: string;
  title: string;
  authors: string[];
  publisher?: string;
  year?: number;
  isbn?: string;
  category?: string;
  description?: string;
  available_copies: number;
  total_copies: number;
  edition?: string;
  shelf_location?: string;
  cover_url?: string;
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },
  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: Library },
  { label: "Admin",       href: "/librarian", icon: ShieldCheck },
];

// ── PDF Preview ─────────────────────────────────────────────────────────────────────
function PdfPreview({ pdfKey }: { pdfKey: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api.get("/archive/download-url", { params: { key: pdfKey } })
      .then(({ data }) => { if (!cancelled) setUrl(data.data.url); })
      .catch(() => { if (!cancelled) setUrl(`http://localhost:9000/dkp-files/${pdfKey}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pdfKey]);

  if (loading)
    return (
      <div style={{ height: 600, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #2563eb", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#6b7280" }}>Loading preview…</p>
        </div>
      </div>
    );

  if (error || !url)
    return (
      <div style={{ height: 400, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Preview unavailable</p>
      </div>
    );

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      {/* PDF Viewer Toolbar */}
      <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ padding: 6, borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={16} />
          </button>
          <input type="number" value={currentPage} onChange={e => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 50, padding: "4px 8px", borderRadius: 4, border: "1px solid #e5e7eb", fontSize: 12, textAlign: "center" }} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>/ 12</span>
          <button style={{ padding: 6, borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ padding: 6, borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }} title="Zoom">
            <span style={{ fontSize: 12, fontWeight: 600 }}>100%</span>
          </button>
          <button style={{ padding: 6, borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }} title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>
      <iframe src={`${url}#page=${currentPage}&view=FitH&toolbar=0`} style={{ width: "100%", height: 600 }} title="PDF Preview" onError={() => setError(true)} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const BOOK_CATEGORIES = ["General","Textbook","Reference","Fiction","Non-Fiction","Novel","Journal","Magazine","Thesis","Science","Technology","Mathematics","History","Other"];

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const itemId = params?.id ?? "";

  const { data: item, isLoading, refetch } = useCatalogItem(itemId);
  const { isAuthenticated, user } = useAuthStore();
  const { mutateAsync: addToWishlist, isPending: wishlistPending } = useAddToWishlist();
  const { mutateAsync: placeHold, isPending: holdPending } = usePlaceHold();
  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", isbn: "", authors: "", publisher: "",
    edition: "", year: "", category: "General",
    total_copies: "1", shelf_location: "", description: "",
  });

  const unreadCount = notifData?.unread_count ?? 0;

  useEffect(() => {
    if (item) {
      setEditForm({
        title: item.title ?? "",
        isbn: item.isbn ?? "",
        authors: (item.authors ?? []).join(", "),
        publisher: item.publisher ?? "",
        edition: item.edition ?? "",
        year: item.year?.toString() ?? "",
        category: item.category ?? "General",
        total_copies: item.total_copies?.toString() ?? "1",
        shelf_location: item.shelf_location ?? "",
        description: item.description ?? "",
      });
    }
  }, [item]);

  const isLibrarian = ["librarian", "admin"].includes(user?.role ?? "");

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use wishlist");
      return;
    }
    try {
      await addToWishlist(itemId);
      toast.success("Added to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  const handleHold = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place a hold");
      return;
    }
    try {
      await placeHold(itemId);
      toast.success("Hold placed — you'll be notified when available");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not place hold");
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await updateBook({
        catalog_id: itemId,
        title: editForm.title.trim(),
        isbn: editForm.isbn.trim() || undefined,
        authors: editForm.authors ? editForm.authors.split(",").map(a => a.trim()).filter(Boolean) : [],
        publisher: editForm.publisher.trim() || undefined,
        edition: editForm.edition.trim() || undefined,
        year: editForm.year ? parseInt(editForm.year) : undefined,
        category: editForm.category,
        total_copies: editForm.total_copies ? parseInt(editForm.total_copies) : undefined,
        shelf_location: editForm.shelf_location.trim() || undefined,
        description: editForm.description.trim() || undefined,
      });
      toast.success("Book updated successfully");
      setEditModal(false);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to update book");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBook(itemId);
      toast.success("Book removed from catalog");
      router.push("/library");
    } catch {
      toast.error("Failed to remove book");
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside style={{
        width: 200, flexShrink: 0, background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>Digital Knowledge</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, margin: "2px 0 0" }}>Academic Portal</p>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 6, marginBottom: 2,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  color: active ? "#111827" : "#6b7280",
                  background: active ? "#f3f4f6" : "transparent",
                  borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                  transition: "all 0.1s", cursor: "pointer",
                }}>
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ════════════════ MAIN COLUMN ════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* ── TOP BAR ── */}
        <header style={{
          height: 60, background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center",
          padding: "0 28px", gap: 16, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", flex: 1, maxWidth: 340 }}>
            <Search size={14} color="#9ca3af" />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Search knowledge base...</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Link href="/notifications" style={{ position: "relative", width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", textDecoration: "none" }}>
              <Bell size={18} color="#6b7280" />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
              )}
            </Link>
            <Link href="/library/wishlist" style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Heart size={18} color="#6b7280" />
            </Link>
            <Link href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", overflow: "hidden", textDecoration: "none" }}>
              {user.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Skeleton className="h-96 rounded" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          )}

          {!isLoading && item && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>
              {/* ─────────── LEFT: PDF VIEWER ─────────── */}
              <div>
                {item.cover_url ? (
                  <PdfPreview pdfKey={item.cover_url} />
                ) : (
                  <div style={{ height: 600, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <FileText size={48} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                      <p style={{ fontSize: 13, color: "#6b7280" }}>No preview available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ─────────── RIGHT: METADATA ─────────── */}
              <div>
                {/* Title & Authors */}
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.3, margin: "0 0 8px" }}>
                  {item.title}
                </h1>
                {item.authors?.length > 0 && (
                  <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 }}>
                    {item.authors.join(", ")}
                  </p>
                )}

                {/* Publication Info */}
                {(item.publisher || item.year) && (
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 20px" }}>
                    {[item.publisher, item.year && `Published ${item.year}`].filter(Boolean).join(" • ")}
                  </p>
                )}

                {/* Availability Badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 4,
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                  background: item.available_copies > 0 ? "#e8f0fe" : "#fde8e8",
                  color: item.available_copies > 0 ? "#1a56db" : "#c81e1e",
                  margin: "0 0 20px",
                }}>
                  {item.available_copies > 0 ? `${item.available_copies} Available` : "All on Loan"}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {item.cover_url && (
                    <button style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      border: "none", background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                      color: "#fff", cursor: "pointer", transition: "opacity 0.15s",
                    }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                      <Download size={14} />
                      Download PDF
                    </button>
                  )}

                  <button style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                    border: "1px solid #e5e7eb", background: "#fff",
                    color: "#111827", cursor: "pointer", transition: "all 0.15s",
                  }} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                    <Heart size={14} />
                    Add to Wishlist
                  </button>

                  {item.available_copies > 0 && isAuthenticated && !isLibrarian && (
                    <button style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      border: "1px solid #e5e7eb", background: "#fff",
                      color: "#111827", cursor: "pointer", transition: "all 0.15s",
                    }} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                      <BookMarked size={14} />
                      Reserve
                    </button>
                  )}

                  {item.available_copies === 0 && isAuthenticated && (
                    <button style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      border: "1px solid #e5e7eb", background: "#fff",
                      color: "#111827", cursor: "pointer", transition: "all 0.15s",
                    }} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                      <BookMarked size={14} />
                      Place Hold
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <button style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: "1px solid #e5e7eb", background: "#fff",
                    color: "#111827", cursor: "pointer", transition: "all 0.15s",
                  }} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                    <Share2 size={13} />
                    Share
                  </button>
                  <button style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: "1px solid #e5e7eb", background: "#fff",
                    color: "#111827", cursor: "pointer", transition: "all 0.15s",
                  }} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                    <FileJson size={13} />
                    Citation
                  </button>
                </div>

                {/* Description / Abstract */}
                {item.description && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                      About
                    </h3>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                  {item.isbn && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>ISBN</p>
                      <p style={{ fontSize: 13, color: "#111827", margin: 0 }}>{item.isbn}</p>
                    </div>
                  )}
                  {item.category && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Category</p>
                      <p style={{ fontSize: 13, color: "#111827", margin: 0 }}>{item.category}</p>
                    </div>
                  )}
                  {item.year && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Published</p>
                      <p style={{ fontSize: 13, color: "#111827", margin: 0 }}>{item.year}</p>
                    </div>
                  )}
                </div>

                {/* Librarian Actions */}
                {isLibrarian && (
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 16, display: "flex", gap: 8 }}>
                    <button style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      border: "1px solid #e5e7eb", background: "#fff",
                      color: "#111827", cursor: "pointer", transition: "all 0.15s",
                    }} onClick={() => setEditModal(true)} onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      border: "1px solid #ef4444", background: "#fff",
                      color: "#ef4444", cursor: "pointer", transition: "all 0.15s",
                    }} onClick={() => setDeleteModal(true)} onMouseEnter={e => { e.currentTarget.style.background = "#fde8e8"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && !item && (
            <div style={{ textAlign: "center", padding: "60px 32px" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Book not found</p>
              <button onClick={() => router.back()} style={{ fontSize: 13, color: "#2563eb", marginTop: 12, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Go back
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Book Details" size="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Title" required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="ISBN" value={editForm.isbn} onChange={e => setEditForm(f => ({ ...f, isbn: e.target.value }))} />
          </div>
          <Input label="Authors" value={editForm.authors} onChange={e => setEditForm(f => ({ ...f, authors: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Publisher" value={editForm.publisher} onChange={e => setEditForm(f => ({ ...f, publisher: e.target.value }))} />
            <Input label="Edition" value={editForm.edition} onChange={e => setEditForm(f => ({ ...f, edition: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Input label="Year" type="number" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} />
            <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13 }}>
              {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input label="Total Copies" type="number" min="1" value={editForm.total_copies} onChange={e => setEditForm(f => ({ ...f, total_copies: e.target.value }))} />
          </div>
          <Input label="Shelf Location" value={editForm.shelf_location} onChange={e => setEditForm(f => ({ ...f, shelf_location: e.target.value }))} />
          <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <button onClick={() => setEditModal(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={isUpdating} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.6 : 1 }}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Book"
        description={`Are you sure you want to remove "${item?.title}" from the catalog?`}
        confirmLabel="Remove"
        loading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
