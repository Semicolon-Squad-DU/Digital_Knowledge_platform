"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, BookMarked, Pencil, Trash2,
  FileText, Download, Share2, FileJson, ArrowLeft,
  Lock, Clock, XCircle, LogIn,
} from "lucide-react";
import {
  useCatalogItem, useAddToWishlist, useWishlist, useRemoveFromWishlist, usePlaceHold, useCancelHold, useMemberHolds,
  useUpdateCatalogItem, useDeleteCatalogItem, useRequestCatalogAccess,
} from "@/features/library/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS } from "@/components/design/dkpTheme";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { BarcodeLabel } from "@/components/library/BarcodeLabel";
import toast from "react-hot-toast";
import api from "@/lib/api";

// ── PDF Preview ─────────────────────────────────────────────────────────────────────
function PdfPreview({ itemId }: { itemId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.get(`/library/catalog/${itemId}/download-url`)
      .then(({ data }) => {
        // Presigned URLs sign the Host header (X-Amz-SignedHeaders=host) —
        // rewriting the hostname after signing invalidates the signature.
        if (!cancelled) setUrl(data.data.url);
      })
      .catch(() => { if (!cancelled) setUrl(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [itemId]);

  if (loading) {
    return (
      <div style={{ height: 560, borderRadius: 12, background: "#f9f9ff", border: "1px solid #c8c5cd", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #0D47A1", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#555f6d" }}>Loading preview…</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div style={{ height: 400, borderRadius: 12, background: "#f9f9ff", border: "1px solid #c8c5cd", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "#555f6d" }}>Preview unavailable</p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c8c5cd", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <iframe src={url} style={{ width: "100%", height: 560, border: "none" }} title="PDF Preview" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const BOOK_CATEGORIES = ["General", "Textbook", "Reference", "Fiction", "Non-Fiction", "Novel", "Journal", "Magazine", "Thesis", "Science", "Technology", "Mathematics", "History", "Other"];

// Librarians have the same authority over library books that archivists have
// over archive items — including setting/viewing "restricted", subject to the
// same request/approve/deny flow for everyone below that tier.
const ACCESS_TIERS = [
  { value: "public",     label: "Public — visible to everyone" },
  { value: "member",     label: "Member — signed-in users" },
  { value: "staff",      label: "Staff — researchers, librarians, admins" },
  { value: "restricted", label: "Restricted — approval required" },
];

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = params?.id ?? "";

  const { user, isAuthenticated } = useAuthStore();
  const { data: item, isLoading, error, refetch } = useCatalogItem(itemId);
  const { mutateAsync: requestAccess, isPending: isSubmittingRequest } = useRequestCatalogAccess();
  const [accessReason, setAccessReason] = useState("");

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessReason.trim()) {
      toast.error("Please enter a reason for requesting access");
      return;
    }
    try {
      await requestAccess({ id: itemId, reason: accessReason.trim() });
      toast.success("Access request submitted successfully!");
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to submit request");
    }
  };

  const apiError = error as { response?: { status?: number; data?: { data?: {
    catalog_id: string; title: string; category: string; access_tier: string;
    request_status: string | null; rejection_message?: string | null;
  } } } } | null;
  const isForbidden = apiError?.response?.status === 403;
  const restrictedData = apiError?.response?.data?.data;
  const { mutateAsync: addToWishlist, isPending: isAddingToWishlist } = useAddToWishlist();
  const { mutateAsync: removeFromWishlist, isPending: isRemovingFromWishlist } = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist(isAuthenticated);
  const isWishlisted = !!wishlist?.some((w: { catalog_id: string }) => w.catalog_id === itemId);

  const { mutateAsync: placeHold, isPending: isPlacingHold } = usePlaceHold();
  const { mutateAsync: cancelHold, isPending: isCancellingHold } = useCancelHold();
  const { data: memberHolds } = useMemberHolds(isAuthenticated ? (user?.user_id ?? "") : "");
  const activeHold: { hold_id: string; catalog_id: string; status: string } | undefined = memberHolds?.find(
    (h: { catalog_id: string; status: string }) => h.catalog_id === itemId && ["pending", "available"].includes(h.status)
  );
  const [showCancelHoldConfirm, setShowCancelHoldConfirm] = useState(false);
  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", isbn: "", authors: "", publisher: "",
    edition: "", year: "", category: "General",
    total_copies: "1", shelf_location: "", description: "", barcode: "",
    access_tier: "public",
  });

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
        barcode: item.barcode ?? "",
        access_tier: item.access_tier ?? "public",
      });
    }
  }, [item]);

  // Staff (admin+librarian) don't see patron actions (wishlist/hold/cite/share).
  const isLibrarian = ["librarian", "admin"].includes(user?.role ?? "");
  // But only librarian actually edits/deletes catalog entries directly here —
  // admin manages the catalog through the Admin panel, not this patron page.
  const canManageCatalog = user?.role === "librarian";

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add to wishlist");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(itemId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(itemId);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error(isWishlisted ? "Failed to remove from wishlist" : "Failed to add to wishlist");
    }
  };

  const handleHold = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to reserve books");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (activeHold) {
      setShowCancelHoldConfirm(true);
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

  const handleCancelHold = async () => {
    if (!activeHold) return;
    try {
      await cancelHold(activeHold.hold_id);
      toast.success("Hold cancelled");
    } catch {
      toast.error("Failed to cancel hold");
    } finally {
      setShowCancelHoldConfirm(false);
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
        barcode: editForm.barcode.trim() || undefined,
        access_tier: editForm.access_tier as "public" | "member" | "staff" | "restricted",
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

  const handleCopyCitation = () => {
    if (!item) return;
    const citation = `${item.authors?.join(", ")} (${item.year || "n.d."}). ${item.title}. ${item.publisher || ""}.`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    toast.success("APA citation copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!item?.document_url) return;
    try {
      const { data } = await api.get(`/library/catalog/${itemId}/download-url?download=true`);
      // The presigned URL already sets Content-Disposition: attachment, so a
      // click-through anchor downloads it in place — window.open would spawn
      // an extra (empty) tab alongside the download.
      const link = document.createElement("a");
      link.href = data.data.url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Could not open document. Please try again.");
    }
  };

  // ─────────── 403 Forbidden: Restricted Access Screen ───────────
  if (isForbidden && restrictedData) {
    const statusText = restrictedData.request_status;

    return (
      <CollectionShell active="Library">
        <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto", fontFamily: SANS }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "none", background: "none", color: "#555f6d",
              fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Back to Library
          </button>

          <div style={{
            background: "#fff", border: "1px solid #c8c5cd", borderRadius: 16,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}>
            <div style={{ height: 6, background: "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)" }} />

            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#fef2f2",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", border: "1px solid #fee2e2",
              }}>
                <Lock size={24} color="#dc2626" />
              </div>

              <span style={{
                display: "inline-flex", alignItems: "center", padding: "4px 10px",
                borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.5px", background: "#fde8e8", color: "#c81e1e", marginBottom: 12,
              }}>
                Restricted Book
              </span>

              <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: C.ink, margin: "0 0 8px", lineHeight: 1.3 }}>
                {restrictedData.title}
              </h1>
              <p style={{ fontSize: 13, color: "#555f6d", margin: "0 auto 24px", maxWidth: 500 }}>
                This book belongs to the &quot;{restrictedData.access_tier}&quot; access tier. You do not have permission to view or borrow it directly.
              </p>

              {!isAuthenticated ? (
                <div style={{
                  maxWidth: 500, margin: "0 auto", background: "#f9f9ff", border: "1px solid #c8c5cd",
                  borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, textAlign: "left",
                }}>
                  <LogIn size={36} color="#47464c" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#141b2b", margin: 0 }}>Sign in to request access</h4>
                    <p style={{ fontSize: 13, color: "#555f6d", margin: "4px 0 12px", lineHeight: 1.4 }}>
                      This book requires an account. Sign in and you&apos;ll be able to submit an access request.
                    </p>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/library/${itemId}`)}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
                        borderRadius: 8, background: C.ink, color: "#fff",
                        fontSize: 13, fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : !statusText ? (
                <form onSubmit={handleRequestAccess} style={{
                  maxWidth: 500, margin: "0 auto", textAlign: "left", background: "#f9f9ff",
                  border: "1px solid #c8c5cd", borderRadius: 12, padding: 20,
                }}>
                  <label style={{
                    display: "block", fontSize: 13, fontWeight: 700, color: "#47464c",
                    marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    Reason for requesting access
                  </label>
                  <textarea
                    required
                    value={accessReason}
                    onChange={(e) => setAccessReason(e.target.value)}
                    placeholder="Provide a valid academic reason (e.g. Course reading, thesis reference)..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #c8c5cd",
                      fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none",
                      marginBottom: 16, background: "#fff", boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    style={{
                      width: "100%", padding: "11px 16px", borderRadius: 8, border: "none",
                      background: C.ink, color: "#fff", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", textAlign: "center", opacity: isSubmittingRequest ? 0.7 : 1,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    {isSubmittingRequest ? "Submitting Request..." : "Submit Access Request"}
                  </button>
                </form>
              ) : statusText === "pending" ? (
                <div style={{
                  maxWidth: 500, margin: "0 auto", background: "#eff6ff", border: "1px solid #bfdbfe",
                  borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, textAlign: "left",
                }}>
                  <Clock size={36} color="#0D47A1" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", margin: 0 }}>Access Request Pending</h4>
                    <p style={{ fontSize: 13, color: "#1e40af", margin: "4px 0 0", lineHeight: 1.4 }}>
                      Your access request has been sent to the Librarian and Administrator. You will receive an in-app notification once it&apos;s reviewed.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "left" }}>
                  <div style={{
                    background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12,
                    padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16,
                  }}>
                    <XCircle size={36} color="#b91c1c" style={{ flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#7f1d1d", margin: 0 }}>Access Request Denied</h4>
                      <p style={{ fontSize: 13, color: "#991b1b", margin: "4px 0 0", lineHeight: 1.4 }}>
                        {restrictedData.rejection_message
                          ? `Reason: ${restrictedData.rejection_message}`
                          : "Your request to view this restricted book has been reviewed and declined."}
                        {" "}You may submit a new request below.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRequestAccess} style={{
                    background: "#f9f9ff", border: "1px solid #c8c5cd", borderRadius: 12, padding: 20,
                  }}>
                    <label style={{
                      display: "block", fontSize: 13, fontWeight: 700, color: "#47464c",
                      marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                      Reason for requesting access again
                    </label>
                    <textarea
                      required
                      value={accessReason}
                      onChange={(e) => setAccessReason(e.target.value)}
                      placeholder="Provide an updated reason for this request..."
                      rows={3}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #c8c5cd",
                        fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none",
                        marginBottom: 16, background: "#fff", boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      style={{
                        width: "100%", padding: "11px 16px", borderRadius: 8, border: "none",
                        background: C.ink, color: "#fff", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", textAlign: "center", opacity: isSubmittingRequest ? 0.7 : 1,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      {isSubmittingRequest ? "Submitting Request..." : "Submit New Access Request"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </CollectionShell>
    );
  }

  return (
    <CollectionShell active="Library">
      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto", fontFamily: SANS }}>

        {/* Breadcrumbs Row */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#555f6d" }}>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/library")}>Library</span>
            <span>/</span>
            <span style={{ color: "#141b2b", fontWeight: 500 }}>Book Details</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.ink,
            margin: 0,
            lineHeight: 1.2,
            fontFamily: SERIF,
          }}>
            Book Details
          </h1>
        </div>

        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Skeleton className="h-96 rounded-xl" />
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
              {item.document_url ? (
                <PdfPreview itemId={itemId} />
              ) : (
                <div style={{
                  height: 560,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid #c8c5cd",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <FileText size={48} color="#c8c5cd" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#47464c", margin: 0 }}>No preview available</p>
                    <p style={{ fontSize: 12, color: "#78767d", marginTop: 4 }}>This catalog entry does not have a PDF document attached.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─────────── RIGHT: METADATA ─────────── */}
            <div>
              <div style={{
                background: "#fff",
                border: "1px solid #c8c5cd",
                borderRadius: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}>
                {/* Title & Authors */}
                <div>
                  <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: C.ink, lineHeight: 1.3, margin: "0 0 6px" }}>
                    {item.title}
                  </h1>
                  {item.authors?.length > 0 && (
                    <p style={{ fontSize: 13, color: "#555f6d", margin: 0, fontWeight: 500 }}>
                      by {item.authors.join(", ")}
                    </p>
                  )}
                </div>

                {/* Badges / Availability */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: item.available_copies > 0 ? "#e6f4ea" : "#fde8e8",
                    color: item.available_copies > 0 ? "#1e7e34" : "#c81e1e",
                  }}>
                    {item.available_copies > 0 ? `${item.available_copies} Available` : "All on Loan"}
                  </span>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#f1f3ff",
                    color: "#4b5563",
                  }}>
                    {item.category}
                  </span>
                  {item.access_tier && item.access_tier !== "public" && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: "#fef3c7",
                      color: "#92400e",
                    }}>
                      {item.access_tier}
                    </span>
                  )}
                </div>

                {/* Primary Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {item.document_url && (
                    <button
                      onClick={handleDownloadPdf}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        background: C.ink,
                        color: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  )}

                  {/* Wishlist is a patron intent signal — not applicable to staff (admin/librarian) managing the catalog. */}
                  {!isLibrarian && (
                    <button
                      onClick={handleWishlist}
                      disabled={isAddingToWishlist || isRemovingFromWishlist}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: isWishlisted
                          ? "1.5px solid color-mix(in srgb, #0D47A1 35%, transparent)"
                          : "1px solid #c8c5cd",
                        background: isWishlisted
                          ? "color-mix(in srgb, #0D47A1 10%, #fff)"
                          : "#fff",
                        color: isWishlisted ? C.accent : "#47464c",
                        cursor: (isAddingToWishlist || isRemovingFromWishlist) ? "not-allowed" : "pointer",
                        opacity: (isAddingToWishlist || isRemovingFromWishlist) ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (isWishlisted) {
                          e.currentTarget.style.background = "color-mix(in srgb, #0D47A1 16%, #fff)";
                        } else {
                          e.currentTarget.style.background = "#f9f9ff";
                          e.currentTarget.style.borderColor = "#c8c5cd";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (isWishlisted) {
                          e.currentTarget.style.background = "color-mix(in srgb, #0D47A1 10%, #fff)";
                        } else {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#c8c5cd";
                        }
                      }}
                    >
                      <Heart size={14} fill={isWishlisted ? C.accent : "none"} />
                      {isWishlisted ? "Added to Wishlist" : "Add to Wishlist"}
                    </button>
                  )}

                  {!isLibrarian && (
                    <button
                      onClick={handleHold}
                      disabled={isPlacingHold || isCancellingHold}
                      title={activeHold ? "Click to cancel your hold" : undefined}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: activeHold
                          ? "1.5px solid color-mix(in srgb, #0D47A1 35%, transparent)"
                          : "1px solid #c8c5cd",
                        background: activeHold
                          ? "color-mix(in srgb, #0D47A1 10%, #fff)"
                          : "#fff",
                        color: activeHold ? "var(--avatar-theme-color, #4f46e5)" : "#47464c",
                        cursor: (isPlacingHold || isCancellingHold) ? "not-allowed" : "pointer",
                        opacity: (isPlacingHold || isCancellingHold) ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (activeHold) {
                          e.currentTarget.style.background = "color-mix(in srgb, #0D47A1 16%, #fff)";
                        } else {
                          e.currentTarget.style.background = "#f9f9ff";
                          e.currentTarget.style.borderColor = "#c8c5cd";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeHold) {
                          e.currentTarget.style.background = "color-mix(in srgb, #0D47A1 10%, #fff)";
                        } else {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#c8c5cd";
                        }
                      }}
                    >
                      <BookMarked size={14} fill={activeHold ? "#0D47A1" : "none"} />
                      {activeHold
                        ? (activeHold.status === "available" ? "Ready for Pickup" : "Hold Requested")
                        : item.available_copies > 0 ? "Reserve Book" : "Place Hold"}
                    </button>
                  )}
                </div>

                {/* Secondary Actions — citation/share are for patrons referencing the book in their own work, not staff managing the catalog. */}
                {!isLibrarian && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={handleCopyCitation}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid #c8c5cd",
                      background: "#fff",
                      color: "#47464c",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9f9ff";
                      e.currentTarget.style.borderColor = "#c8c5cd";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#c8c5cd";
                    }}
                  >
                    <FileJson size={13} />
                    {copied ? "Copied!" : "Cite"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid #c8c5cd",
                      background: "#fff",
                      color: "#47464c",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9f9ff";
                      e.currentTarget.style.borderColor = "#c8c5cd";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#c8c5cd";
                    }}
                  >
                    <Share2 size={13} />
                    Share
                  </button>
                </div>
                )}

                {/* About Book / Description */}
                {item.description && (
                  <div style={{ borderTop: "1px solid #f1f3ff", paddingTop: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#78767d", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>
                      About
                    </h3>
                    <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Bibliographic Info */}
                <div style={{ borderTop: "1px solid #f1f3ff", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {item.isbn && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>ISBN</span>
                      <span style={{ color: "#141b2b", fontWeight: 600, fontFamily: "monospace" }}>{item.isbn}</span>
                    </div>
                  )}
                  {item.publisher && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>Publisher</span>
                      <span style={{ color: "#141b2b", fontWeight: 600, textAlign: "right" }}>{item.publisher}</span>
                    </div>
                  )}
                  {item.edition && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>Edition</span>
                      <span style={{ color: "#141b2b", fontWeight: 600 }}>{item.edition}</span>
                    </div>
                  )}
                  {item.year && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>Published Year</span>
                      <span style={{ color: "#141b2b", fontWeight: 600 }}>{item.year}</span>
                    </div>
                  )}
                  {item.shelf_location && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>Shelf Location</span>
                      <span style={{ color: "#0D47A1", fontWeight: 700, fontFamily: "monospace" }}>{item.shelf_location}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#78767d", fontWeight: 500 }}>Total Copies</span>
                    <span style={{ color: "#141b2b", fontWeight: 600 }}>{item.total_copies}</span>
                  </div>
                  {canManageCatalog && item.barcode && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#78767d", fontWeight: 500 }}>Book ID / Barcode</span>
                      <span style={{ color: "#0D47A1", fontWeight: 700, fontFamily: "monospace" }}>{item.barcode}</span>
                    </div>
                  )}
                </div>

                {/* Barcode / QR — librarian scan & print */}
                {canManageCatalog && (
                  <div style={{ borderTop: "1px solid #f1f3ff", paddingTop: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#78767d", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>
                      Barcode / QR Label
                    </h3>
                    <BarcodeLabel item={{
                      catalog_id: item.catalog_id,
                      barcode: item.barcode,
                      title: item.title,
                      isbn: item.isbn,
                      shelf_location: item.shelf_location,
                    }} />
                  </div>
                )}

                {/* Access Tier — directly visible, not buried in the Edit modal */}
                {canManageCatalog && (
                  <div style={{ borderTop: "1px solid #f1f3ff", paddingTop: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#78767d", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>
                      Access Tier
                    </h3>
                    <p style={{ fontSize: 12, color: "#555f6d", margin: "0 0 10px" }}>
                      Controls who can view or borrow this book.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ACCESS_TIERS.map((tierOption) => {
                        const isActive = item.access_tier === tierOption.value;
                        let tierColor = "#4b5563";
                        if (tierOption.value === "public") tierColor = "#059669";
                        if (tierOption.value === "member") tierColor = "#0D47A1";
                        if (tierOption.value === "staff") tierColor = "#7c3aed";
                        if (tierOption.value === "restricted") tierColor = "#dc2626";

                        return (
                          <button
                            key={tierOption.value}
                            onClick={async () => {
                              try {
                                await updateBook({ catalog_id: itemId, access_tier: tierOption.value as "public" | "member" | "staff" | "restricted" });
                                toast.success(`Access tier updated to ${tierOption.value.toUpperCase()}!`);
                                refetch();
                              } catch {
                                toast.error("Failed to update access tier");
                              }
                            }}
                            disabled={isUpdating || isActive}
                            style={{
                              padding: "8px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: isActive ? "default" : "pointer",
                              transition: "all 0.2s ease",
                              border: isActive ? `1.5px solid ${tierColor}` : "1px solid #c8c5cd",
                              background: isActive ? `color-mix(in srgb, ${tierColor} 10%, #ffffff)` : "#ffffff",
                              color: isActive ? tierColor : "#4b5563",
                              opacity: isUpdating && !isActive ? 0.6 : 1,
                            }}
                          >
                            {tierOption.value.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Librarian Actions */}
                {canManageCatalog && (
                  <div style={{ borderTop: "1px solid #f1f3ff", paddingTop: 16, display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setEditModal(true)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "1px solid #c8c5cd",
                        background: "#fff",
                        color: "#47464c",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f9f9ff";
                        e.currentTarget.style.borderColor = "#c8c5cd";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#c8c5cd";
                      }}
                    >
                      <Pencil size={13} />
                      Edit Details
                    </button>
                    <button
                      onClick={() => setDeleteModal(true)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#dc2626",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* A request that never got a response (server down/restarting, network
            drop) is not the same fact as the backend saying "no such row" —
            conflating them told users a real book had been deleted. */}
        {!isLoading && !item && error && !(error as { response?: unknown }).response && (
          <div style={{
            background: "#fff",
            border: "1px solid #c8c5cd",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#141b2b", margin: 0 }}>Couldn&apos;t load this book</p>
            <p style={{ fontSize: 13, color: "#555f6d", marginTop: 4, marginBottom: 16 }}>
              We couldn&apos;t reach the server. Check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #c8c5cd",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: "#47464c",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !item && (!error || (error as { response?: unknown }).response) && (
          <div style={{
            background: "#fff",
            border: "1px solid #c8c5cd",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#141b2b", margin: 0 }}>Book not found</p>
            <p style={{ fontSize: 13, color: "#555f6d", marginTop: 4, marginBottom: 16 }}>
              The requested book catalog ID does not exist or has been deleted.
            </p>
            <button
              onClick={() => router.back()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #c8c5cd",
                background: "#fff",
                color: "#47464c",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go Back
            </button>
          </div>
        )}

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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#47464c" }}>Category</label>
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ height: 38, padding: "8px 12px", borderRadius: 6, border: "1px solid #c8c5cd", fontSize: 16, outline: "none", background: "#fff", cursor: "pointer" }}>
                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Total Copies" type="number" min="1" value={editForm.total_copies} onChange={e => setEditForm(f => ({ ...f, total_copies: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Shelf Location" value={editForm.shelf_location} onChange={e => setEditForm(f => ({ ...f, shelf_location: e.target.value }))} />
            <Input label="Barcode" value={editForm.barcode} onChange={e => setEditForm(f => ({ ...f, barcode: e.target.value }))} hint="Scannable code printed on the label" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#47464c" }}>Access Tier</label>
            <select value={editForm.access_tier} onChange={e => setEditForm(f => ({ ...f, access_tier: e.target.value }))} style={{ height: 38, padding: "8px 12px", borderRadius: 6, border: "1px solid #c8c5cd", fontSize: 16, outline: "none", background: "#fff", cursor: "pointer" }}>
              {ACCESS_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#47464c" }}>Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #c8c5cd", fontSize: 16, fontFamily: "inherit", resize: "none", outline: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #c8c5cd", paddingTop: 16, marginTop: 8 }}>
            <button onClick={() => setEditModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", color: "#47464c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={isUpdating} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.6 : 1 }}>
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

      {/* Cancel Hold Confirm */}
      <ConfirmDialog
        isOpen={showCancelHoldConfirm}
        onClose={() => setShowCancelHoldConfirm(false)}
        onConfirm={handleCancelHold}
        title="Cancel Hold"
        description={`Cancel your ${activeHold?.status ?? ""} hold on "${item?.title}"? You'll lose your place in the queue.`}
        confirmLabel="Cancel Hold"
        loading={isCancellingHold}
        variant="danger"
      />
    </CollectionShell>
  );
}
