"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart, BookMarked, Pencil, Trash2,
  FileText, Download, Share2, FileJson, ArrowLeft
} from "lucide-react";
import {
  useCatalogItem, useAddToWishlist, usePlaceHold,
  useUpdateCatalogItem, useDeleteCatalogItem,
} from "@/hooks/useLibrary";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";
import api from "@/lib/api";

// ── PDF Preview ─────────────────────────────────────────────────────────────────────
function PdfPreview({ pdfKey }: { pdfKey: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Clean S3 key by removing S3 scheme/prefix if present
    const cleanKey = pdfKey.replace(/^local:\/\//, "");

    api.get("/archive/download-url", { params: { key: cleanKey } })
      .then(({ data }) => {
        if (!cancelled) {
          const urlWithIp = data.data.url.replace("localhost:9000", "127.0.0.1:9000");
          setUrl(urlWithIp);
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(`http://127.0.0.1:9000/dkp-files/${cleanKey}`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [pdfKey]);

  if (loading) {
    return (
      <div style={{ height: 560, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #2563eb", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#6b7280" }}>Loading preview…</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div style={{ height: 400, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Preview unavailable</p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <iframe src={url} style={{ width: "100%", height: 560, border: "none" }} title="PDF Preview" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const BOOK_CATEGORIES = ["General", "Textbook", "Reference", "Fiction", "Non-Fiction", "Novel", "Journal", "Magazine", "Thesis", "Science", "Technology", "Mathematics", "History", "Other"];

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = params?.id ?? "";

  const { user, ready } = useAuthGuard();
  const { data: item, isLoading, refetch } = useCatalogItem(itemId);
  const { mutateAsync: addToWishlist } = useAddToWishlist();
  const { mutateAsync: placeHold } = usePlaceHold();
  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", isbn: "", authors: "", publisher: "",
    edition: "", year: "", category: "General",
    total_copies: "1", shelf_location: "", description: "",
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
      });
    }
  }, [item]);

  const isLibrarian = ["librarian", "admin"].includes(user?.role ?? "");

  const handleWishlist = async () => {
    try {
      await addToWishlist(itemId);
      toast.success("Added to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  const handleHold = async () => {
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

  const handleCopyCitation = () => {
    if (!item) return;
    const citation = `${item.authors?.join(", ")} (${item.year || "n.d."}). ${item.title}. ${item.publisher || ""}.`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    toast.success("APA citation copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!item?.cover_url) return;
    const cleanKey = item.cover_url.replace(/^local:\/\//, "");
    try {
      const { data } = await api.get("/archive/download-url", { params: { key: cleanKey } });
      const downloadUrl = data.data.url.replace("localhost:9000", "127.0.0.1:9000");
      window.open(downloadUrl, "_blank");
    } catch {
      window.open(`http://127.0.0.1:9000/dkp-files/${cleanKey}`, "_blank");
    }
  };

  if (!ready) return null;

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Back Button & Breadcrumbs Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "var(--avatar-theme-color, #d1d5db)";
              e.currentTarget.style.color = "var(--avatar-theme-color, #111827)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#374151";
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/library")}>Library</span>
            <span>/</span>
            <span style={{ color: "#111827", fontWeight: 500 }}>Book Details</span>
          </div>
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
              {item.cover_url ? (
                <PdfPreview pdfKey={item.cover_url} />
              ) : (
                <div style={{
                  height: 560,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <FileText size={48} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>No preview available</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>This catalog entry does not have a PDF document attached.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─────────── RIGHT: METADATA ─────────── */}
            <div>
              <div style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}>
                {/* Title & Authors */}
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.3, margin: "0 0 6px" }}>
                    {item.title}
                  </h1>
                  {item.authors?.length > 0 && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontWeight: 500 }}>
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
                    background: "#f3f4f6",
                    color: "#4b5563",
                  }}>
                    {item.category}
                  </span>
                </div>

                {/* Primary Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {item.cover_url && (
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
                        background: "var(--theme-gradient-160)",
                        color: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  )}

                  <button
                    onClick={handleWishlist}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "10px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <Heart size={14} />
                    Add to Wishlist
                  </button>

                  {item.available_copies > 0 && !isLibrarian && (
                    <button
                      onClick={handleHold}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <BookMarked size={14} />
                      Reserve Book
                    </button>
                  )}

                  {item.available_copies === 0 && (
                    <button
                      onClick={handleHold}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <BookMarked size={14} />
                      Place Hold
                    </button>
                  )}
                </div>

                {/* Secondary Actions */}
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
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
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
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <Share2 size={13} />
                    Share
                  </button>
                </div>

                {/* About Book / Description */}
                {item.description && (
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>
                      About
                    </h3>
                    <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Bibliographic Info */}
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {item.isbn && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", fontWeight: 500 }}>ISBN</span>
                      <span style={{ color: "#111827", fontWeight: 600, fontFamily: "monospace" }}>{item.isbn}</span>
                    </div>
                  )}
                  {item.publisher && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", fontWeight: 500 }}>Publisher</span>
                      <span style={{ color: "#111827", fontWeight: 600, textAlign: "right" }}>{item.publisher}</span>
                    </div>
                  )}
                  {item.edition && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", fontWeight: 500 }}>Edition</span>
                      <span style={{ color: "#111827", fontWeight: 600 }}>{item.edition}</span>
                    </div>
                  )}
                  {item.year && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", fontWeight: 500 }}>Published Year</span>
                      <span style={{ color: "#111827", fontWeight: 600 }}>{item.year}</span>
                    </div>
                  )}
                  {item.shelf_location && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af", fontWeight: 500 }}>Shelf Location</span>
                      <span style={{ color: "#2563eb", fontWeight: 700, fontFamily: "monospace" }}>{item.shelf_location}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#9ca3af", fontWeight: 500 }}>Total Copies</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>{item.total_copies}</span>
                  </div>
                </div>

                {/* Librarian / Admin Actions */}
                {isLibrarian && (
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", gap: 10 }}>
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
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
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

        {!isLoading && !item && (
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Book not found</p>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 16 }}>The requested book catalog ID does not exist or has been deleted.</p>
            <button
              onClick={() => router.back()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
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
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Category</label>
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ height: 38, padding: "8px 12px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff", cursor: "pointer" }}>
                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Total Copies" type="number" min="1" value={editForm.total_copies} onChange={e => setEditForm(f => ({ ...f, total_copies: e.target.value }))} />
          </div>
          <Input label="Shelf Location" value={editForm.shelf_location} onChange={e => setEditForm(f => ({ ...f, shelf_location: e.target.value }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 8 }}>
            <button onClick={() => setEditModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={isUpdating} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--theme-gradient-160)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isUpdating ? 0.6 : 1 }}>
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
    </AppLayout>
  );
}
