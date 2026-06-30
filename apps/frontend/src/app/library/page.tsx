"use client";

import React, { useState, useCallback } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Search, BookOpen,
  ChevronDown, X, Plus,
  FileText, Upload, Filter,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCatalogSearch, useCreateCatalogItem, useDeleteCatalogItem, useAddToWishlist } from "@/features/library/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";
import { ResultCard, type CatalogItem } from "./ResultCard";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "",              label: "All Categories" },
  { value: "Social Sciences", label: "Social Sciences" },
  { value: "Science",       label: "Hard Sciences" },
  { value: "Humanities",    label: "Humanities" },
  { value: "Technology",    label: "Technology" },
  { value: "Textbook",      label: "Textbooks" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc",  label: "Oldest First" },
  { value: "title_asc", label: "Title A–Z" },
];

const BOOK_CATEGORIES = ["General","Textbook","Fiction","Non-Fiction","Novel","Magazine","Science","Technology","Mathematics","History","Social Sciences","Humanities","Other"];

// ── Pagination ────────────────────────────────────────────────────────────────
function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  const btn = (content: React.ReactNode, active: boolean, disabled: boolean, onClick: () => void, key: string | number) => (
    <button key={key} onClick={onClick} disabled={disabled} style={{
      width: 36, height: 36, borderRadius: 6, border: "1px solid",
      borderColor: active ? "var(--avatar-theme-color)" : "#e5e7eb",
      background: active ? "var(--avatar-theme-color)" : "#fff",
      color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
      fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {content}
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 32 }}>
      {btn("‹", false, page === 1, () => onChange(page - 1), "prev")}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} style={{ width: 36, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>…</span>
        ) : (
          btn(p, p === page, false, () => onChange(p as number), p)
        )
      )}
      {btn("›", false, page === totalPages, () => onChange(page + 1), "next")}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  // Public catalog page — guests can browse, login is only required for
  // wishlist/librarian actions. Don't redirect unauthenticated visitors away.
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isLibrarian = isAuthenticated && ["librarian", "admin"].includes(user?.role ?? "");

  const [searchInput, setSearchInput]   = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [yearInput, setYearInput]       = useState("");
  const [yearFilter, setYearFilter]     = useState("");
  const [sortBy, setSortBy]             = useState("relevance");

  // Advanced Search Filters state
  const [authorInput, setAuthorInput]   = useState("");
  const [isbnInput, setIsbnInput]       = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [params, setParams] = useState<{
    query: string; category: string;
    availability: "all" | "available" | "on_loan";
    author?: string; isbn?: string;
    year_from?: number; year_to?: number;
    page: number; limit: number;
  }>({
    query: "", category: "", availability: "all",
    page: 1, limit: 10,
  });

  // Add modal state
  const [addModal, setAddModal]   = useState(false);
  const [pdfFile, setPdfFile]     = useState<File | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [bookForm, setBookForm] = useState({
    title: "", isbn: "", authors: "", publisher: "",
    edition: "", year: "", category: "General",
    total_copies: "1", shelf_location: "", description: "",
  });

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setPdfFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1, maxSize: 500 * 1024 * 1024,
  });

  const { data, isLoading, isError, refetch } = useCatalogSearch(params);
  const { mutateAsync: addBook, isPending: isAdding }      = useCreateCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();
  const { mutateAsync: addToWishlist }                     = useAddToWishlist();

  if (!hasHydrated) return null;

  const applyYear = (val: string) => {
    const y = parseInt(val);
    if (!val || isNaN(y)) return;
    setYearFilter(val);
    setYearInput(val);
    setParams(p => ({ ...p, year_from: y, year_to: y, page: 1 }));
  };

  const clearYear = () => {
    setYearFilter("");
    setYearInput("");
    setParams(p => { const { year_from, year_to, ...rest } = p; void year_from; void year_to; return { ...rest, page: 1 }; });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setParams(p => ({ ...p, query: searchInput, page: 1 }));
  };

  const handleAddBook = async () => {
    if (!bookForm.title.trim()) { toast.error("Title is required"); return; }
    try {
      const fd = new FormData();
      Object.entries(bookForm).forEach(([k, v]) => {
        if (k === "authors") fd.append(k, JSON.stringify(v ? v.split(",").map((a: string) => a.trim()).filter(Boolean) : []));
        else fd.append(k, v);
      });
      if (pdfFile) fd.append("file", pdfFile);
      await addBook(fd);
      toast.success("Book added!");
      setAddModal(false); setPdfFile(null);
      setBookForm({ title:"",isbn:"",authors:"",publisher:"",edition:"",year:"",category:"General",total_copies:"1",shelf_location:"",description:"" });
      refetch();
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{message?:string}}})?.response?.data?.message || "Failed to add book");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteBook(deleteId); toast.success("Removed"); setDeleteId(null); refetch(); }
    catch { toast.error("Failed to remove"); }
  };

  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const rawItems = (data?.items ?? []) as CatalogItem[];

  // Client-side sort (backend only supports title ASC)
  const items = [...rawItems].sort((a, b) => {
    switch (sortBy) {
      case "date_desc": return (b.year ?? 0) - (a.year ?? 0);
      case "date_asc":  return (a.year ?? 0) - (b.year ?? 0);
      case "title_asc": return a.title.localeCompare(b.title);
      default:          return 0; // relevance — keep API order
    }
  });

  const topbarActions = null;

  return (
    <AppLayout topbarActions={topbarActions}>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "28px 18px 26px" : "36px 40px 34px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.03em" }}>
                  Library
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Browse and reserve academic textbooks, journals &amp; articles
              </p>
            </div>
            {isLibrarian && (
              <button
                onClick={() => setAddModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "var(--avatar-theme-color, #1a1a2e)", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "opacity 0.2s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} /> Add Book
              </button>
            )}
          </div>

          {/* Integrated search */}
          <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1.5px solid #dde2ff" }}>
            <Search size={16} color="#9ca3af" style={{ marginLeft: 16, flexShrink: 0 }} />
            <input
              type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by title, author, or ISBN…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "13px 12px", color: "#1f2937", background: "transparent" }}
            />
            <button type="submit" style={{ margin: 5, padding: "9px 20px", background: "var(--avatar-theme-color, #1a1a2e)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Search
            </button>
          </form>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "18px 16px" : "24px 40px" }}>

          {/* Category pills + year filter */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Category</span>
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setParams(p => ({ ...p, category: cat.value, page: 1 }))}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: params.category === cat.value ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
                    border: params.category === cat.value ? "1.5px solid color-mix(in srgb, var(--avatar-theme-color, #6366f1) 35%, transparent)" : "1px solid #e5e7eb",
                    background: params.category === cat.value ? "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)" : "#fff",
                    color: params.category === cat.value ? "var(--avatar-theme-color, #4f46e5)" : "#6b7280", transition: "all 0.15s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>Years:</span>
              {yearFilter ? (
                <span style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13, color:"#374151", background:"#fff" }}>
                  {yearFilter}
                  <button onClick={clearYear} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:"#9ca3af", display:"flex" }}><X size={12} /></button>
                </span>
              ) : (
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  min="1900" max="2099"
                  value={yearInput}
                  onChange={e => setYearInput(e.target.value)}
                  onBlur={e => applyYear(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyYear(yearInput); } }}
                  style={{ width:90, padding:"5px 10px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13, outline:"none" }}
                />
              )}
            </div>

            {/* Advanced Search Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: showAdvanced ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                border: showAdvanced ? "1.5px solid color-mix(in srgb, var(--avatar-theme-color, #6366f1) 35%, transparent)" : "1px solid #e5e7eb",
                background: showAdvanced ? "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)" : "#fff",
                color: showAdvanced ? "var(--avatar-theme-color, #4f46e5)" : "#6b7280", transition: "all 0.15s",
              }}
            >
              <Filter size={12} />
              {showAdvanced ? "Hide" : "Advanced"}
            </button>
            </div>{/* closes inner flex row */}
          </div>{/* closes outer pill card */}

          {/* Advanced Search Expandable Panel */}
          {showAdvanced && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 20,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }} className="library-advanced-panel">
              {/* Author Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
                  Author Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jiawei Han"
                  value={authorInput}
                  onChange={e => setAuthorInput(e.target.value)}
                  onBlur={() => setParams(p => ({ ...p, author: authorInput || undefined, page: 1 }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setParams(p => ({ ...p, author: authorInput || undefined, page: 1 })); } }}
                  style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                />
              </div>

              {/* ISBN Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
                  ISBN Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 978-012"
                  value={isbnInput}
                  onChange={e => setIsbnInput(e.target.value)}
                  onBlur={() => setParams(p => ({ ...p, isbn: isbnInput || undefined, page: 1 }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setParams(p => ({ ...p, isbn: isbnInput || undefined, page: 1 })); } }}
                  style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                />
              </div>

              {/* Availability Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>
                  Availability Status
                </label>
                <select
                  value={params.availability}
                  onChange={e => setParams(p => ({ ...p, availability: e.target.value as any, page: 1 }))}
                  style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, color: "#374151", background: "#fff", outline: "none", cursor: "pointer" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available in Library</option>
                  <option value="on_loan">Currently On Loan</option>
                </select>
              </div>
            </div>
          )}

          {/* Results header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ fontSize:14, color:"#374151" }}>
              {isLoading ? "Searching…" : (
                <>Showing <strong>{total.toLocaleString()}</strong> results{activeSearch ? ` for "${activeSearch}"` : ""}</>
              )}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>Sort by:</span>
              <div style={{ position:"relative" }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ padding:"6px 32px 6px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13, color:"#374151", background:"#fff", appearance:"none", cursor:"pointer", outline:"none" }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" }} />
              </div>
            </div>
          </div>

          {/* Error */}
          {isError && <div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>Failed to load catalog. Please try again.</div>}

          {/* Loading skeletons */}
          {isLoading && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"20px 24px" }}>
                  <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                    <Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && items.length === 0 && (
            <div style={{ textAlign:"center", padding:"64px 0" }}>
              <BookOpen size={32} style={{ color:"#d1d5db", margin:"0 auto 12px" }} />
              <p style={{ fontSize:15, fontWeight:600, color:"#374151" }}>No books found</p>
              <p style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>Try different search terms or clear the filters.</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && items.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {items.map(item => (
                <ResultCard
                  key={item.catalog_id}
                  item={item}
                  isLibrarian={isLibrarian}
                  isAuthenticated={isAuthenticated}
                  onWishlist={async () => {
                    try {
                      await addToWishlist(item.catalog_id);
                      toast.success("Added to wishlist");
                    } catch {
                      toast.error("Already in wishlist");
                    }
                  }}
                  onDelete={() => { setDeleteId(item.catalog_id); setDeleteTitle(item.title); }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pager page={params.page} totalPages={totalPages} onChange={p => setParams(prev => ({ ...prev, page: p }))} />
          )}
        </div>
      </div>

      {/* Add Book Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Book to Catalog" size="lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="form-label">Category</label>
            <select value={bookForm.category} onChange={e => setBookForm(f => ({...f, category: e.target.value}))} className="form-select">
              {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Title" required value={bookForm.title} onChange={e => setBookForm(f => ({...f, title: e.target.value}))} placeholder="Book title" />
          <Input label="Authors" value={bookForm.authors} onChange={e => setBookForm(f => ({...f, authors: e.target.value}))} placeholder="Author 1, Author 2" hint="Comma-separated" />
          <div className="space-y-1.5">
            <label className="form-label">Description</label>
            <textarea value={bookForm.description} onChange={e => setBookForm(f => ({...f, description: e.target.value}))} rows={3} className="form-textarea" placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ISBN" value={bookForm.isbn} onChange={e => setBookForm(f => ({...f, isbn: e.target.value}))} />
            <Input label="Publisher" value={bookForm.publisher} onChange={e => setBookForm(f => ({...f, publisher: e.target.value}))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Year" type="number" value={bookForm.year} onChange={e => setBookForm(f => ({...f, year: e.target.value}))} />
            <Input label="Edition" value={bookForm.edition} onChange={e => setBookForm(f => ({...f, edition: e.target.value}))} />
            <Input label="Total Copies" type="number" min="1" required value={bookForm.total_copies} onChange={e => setBookForm(f => ({...f, total_copies: e.target.value}))} />
          </div>
          <Input label="Shelf Location" value={bookForm.shelf_location} onChange={e => setBookForm(f => ({...f, shelf_location: e.target.value}))} placeholder="e.g. A-12" />
          <div>
            <label className="form-label">PDF <span className="font-normal text-[var(--color-fg-muted)]">(optional)</span></label>
            {pdfFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
                <FileText size={16} className="text-[var(--color-accent-fg)]" />
                <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                <span className="text-xs text-[var(--color-fg-muted)]">{formatFileSize(pdfFile.size)}</span>
                <button onClick={() => setPdfFile(null)} className="p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)]"><X size={13} /></button>
              </div>
            ) : (
              <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors", isDragActive ? "border-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]" : "border-[var(--color-border-default)] hover:border-[var(--color-accent-fg)]")}>
                <input {...getInputProps()} />
                <Upload size={18} className="mx-auto mb-1 text-[var(--color-fg-muted)]" />
                <p className="text-sm text-[var(--color-fg-muted)]">Drag & drop PDF or click to browse</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border-muted)]">
            <Button variant="invisible" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddBook} loading={isAdding}>Add to Catalog</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove Book" description={`Remove "${deleteTitle}" from the catalog?`}
        confirmLabel="Remove" loading={isDeleting} variant="danger" />
    </AppLayout>
  );
}
