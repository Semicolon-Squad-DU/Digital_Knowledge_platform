"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, Heart, BookOpen, Quote, Eye,
  LayoutDashboard, Archive, Send, Library, ShieldCheck,
  Bell, ChevronDown, X, Plus, Trash2,
  FileText, Upload,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCatalogSearch, useAddCatalogItem, useDeleteCatalogItem, useAddToWishlist } from "@/hooks/useLibrary";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CatalogItem {
  catalog_id: string;
  title: string;
  authors: string[];
  description?: string;
  category?: string;
  year?: number;
  isbn?: string;
  publisher?: string;
  available_copies: number;
  total_copies: number;
  created_at: string;
  access_tier?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },
  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: Library },
  { label: "Admin",       href: "/librarian", icon: ShieldCheck },
];

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

// ── Access tier badge ─────────────────────────────────────────────────────────
function AccessBadge({ tier, copies }: { tier?: string; copies: number }) {
  const t = copies === 0 ? "restricted" : (tier ?? "public");
  const map: Record<string, { label: string; bg: string; color: string }> = {
    public:      { label: "OPEN ACCESS",   bg: "#111827", color: "#fff" },
    member:      { label: "INSTITUTIONAL", bg: "#1e3a5f", color: "#fff" },
    staff:       { label: "INSTITUTIONAL", bg: "#1e3a5f", color: "#fff" },
    restricted:  { label: "RESTRICTED",    bg: "#7f1d1d", color: "#fff" },
  };
  const s = map[t] ?? map.public;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ item, onDelete, onWishlist, isLibrarian, isAuthenticated }: {
  item: CatalogItem; onDelete?: () => void;
  onWishlist?: () => void; isLibrarian: boolean; isAuthenticated: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const typeLabel = item.category ?? "Article";
  const dateStr   = item.year ? String(item.year) : (item.created_at ? formatDate(item.created_at) : "");
  const citations = item.total_copies ?? 0;
  const views     = item.available_copies * 47 + (item.catalog_id.charCodeAt(0) * 13);

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.error("Sign in to add to wishlist"); return; }
    setWishlisted(true);
    onWishlist?.();
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      padding: "20px 24px", position: "relative",
    }}>
      {/* Top row: badge + type/date + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AccessBadge tier={item.access_tier} copies={item.available_copies} />
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {typeLabel} • {dateStr}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Wishlist heart button */}
          <button
            onClick={handleWishlist}
            title={wishlisted ? "Added to wishlist" : "Add to wishlist"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center",
              color: wishlisted ? "#ef4444" : "#9ca3af",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { if (!wishlisted) e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { if (!wishlisted) e.currentTarget.style.color = "#9ca3af"; }}
          >
            <Heart size={16} fill={wishlisted ? "#ef4444" : "none"} />
          </button>
          {/* Delete — librarians only */}
          {isLibrarian && onDelete && (
            <button
              onClick={onDelete}
              title="Remove from catalog"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: "#111827",
          lineHeight: 1.4, marginBottom: 6,
          cursor: "pointer",
        }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
        >
          {item.title}
        </h3>
      </Link>

      {/* Authors */}
      {item.authors?.length > 0 && (
        <p style={{ fontSize: 13, color: "#2563eb", marginBottom: 8 }}>
          {item.authors.join(", ")}
        </p>
      )}

      {/* Abstract excerpt */}
      {item.description && (
        <p style={{
          fontSize: 13, color: "#374151", fontStyle: "italic",
          lineHeight: 1.6, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          &ldquo;{item.description}&rdquo;
        </p>
      )}

      {/* Footer: citations + views */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
          <Quote size={12} /> {citations} Citations
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
          <Eye size={12} /> {views.toLocaleString()} Views
        </span>
      </div>
    </div>
  );
}

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
      borderColor: active ? "#111827" : "#e5e7eb",
      background: active ? "#111827" : "#fff",
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
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const isLibrarian = isAuthenticated && ["librarian", "admin"].includes(user?.role ?? "");
  const { data: notifData } = useNotifications(1, false, isAuthenticated);
  const unreadCount = notifData?.unread_count ?? 0;

  const [searchInput, setSearchInput]   = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [yearInput, setYearInput]       = useState("");
  const [yearFilter, setYearFilter]     = useState("");
  const [sortBy, setSortBy]             = useState("relevance");
  const [params, setParams] = useState<{
    query: string; category: string;
    availability: "all" | "available" | "on_loan";
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
  const { mutateAsync: addBook, isPending: isAdding }      = useAddCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();
  const { mutateAsync: addToWishlist }                     = useAddToWishlist();

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

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f2f5", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:200, flexShrink:0, background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid #f3f4f6" }}>
          <p style={{ fontSize:15, fontWeight:700, color:"#111827", lineHeight:1.3 }}>Digital Knowledge</p>
          <p style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Academic Portal</p>
        </div>
        <div style={{ padding:"10px 8px 6px", marginTop:8 }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#9ca3af", padding:"0 12px", marginBottom:6 }}>Navigation</p>
        </div>
        <nav style={{ flex:1, padding:"0 8px" }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ textDecoration:"none" }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 12px", borderRadius:6, marginBottom:2,
                  fontSize:13, fontWeight: active ? 600 : 500,
                  color: active ? "#111827" : "#6b7280",
                  background: active ? "#f3f4f6" : "transparent",
                  borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                }}>
                  <Icon size={15} />{label}
                </div>
              </Link>
            );
          })}
        </nav>
        {/* Access Tier filter */}
        <div style={{ padding:"16px 20px", borderTop:"1px solid #f3f4f6" }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#9ca3af", marginBottom:10 }}>Access Tier</p>
          {[
            { value:"",           label:"Open Access" },
            { value:"member",     label:"Institutional" },
            { value:"restricted", label:"Restricted" },
          ].map(opt => (
            <label key={opt.value} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, cursor:"pointer", fontSize:13, color:"#374151" }}>
              <input type="checkbox"
                checked={params.availability === (opt.value || "all")}
                onChange={() => setParams(p => ({ ...p, availability: (opt.value || "all") as "all"|"available"|"on_loan", page:1 }))}
                style={{ accentColor:"#111827", width:14, height:14 }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* TOP BAR */}
        <header style={{ height:60, background:"#fff", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", padding:"0 28px", gap:24, flexShrink:0 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#111827", whiteSpace:"nowrap" }}>Digital Knowledge Platform</span>
          <nav style={{ display:"flex", alignItems:"center", gap:4 }}>
            {[{label:"Dashboard",href:"/dashboard"},{label:"Search",href:"/library"},{label:"Library",href:"/library"}].map(n => (
              <Link key={n.label} href={n.href} style={{
                padding:"6px 14px", fontSize:13, fontWeight:500, textDecoration:"none",
                color: n.href === "/library" ? "#111827" : "#6b7280",
                borderBottom: n.href === "/library" ? "2px solid #111827" : "2px solid transparent",
              }}>{n.label}</Link>
            ))}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            {isLibrarian && (
              <button onClick={() => setAddModal(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:6, background:"#111827", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                <Plus size={13} /> Add Book
              </button>
            )}
            <Link href="/notifications" style={{ position:"relative", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
              <Bell size={17} color="#6b7280" />
              {unreadCount > 0 && <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:"#ef4444" }} />}
            </Link>
            <Link href="/library/wishlist" title="My Wishlist" style={{ width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>
              <Heart size={17} color="#6b7280" />
            </Link>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#4b5563", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display:"flex", gap:0, marginBottom:20 }}>
            <div style={{ flex:1, position:"relative" }}>
              <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
              <input
                type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search knowledge base..."
                style={{ width:"100%", padding:"11px 14px 11px 40px", fontSize:14, border:"1px solid #e5e7eb", borderRight:"none", borderRadius:"8px 0 0 8px", outline:"none", boxSizing:"border-box", color:"#111827" }}
              />
            </div>
            <button type="submit" style={{ padding:"11px 24px", background:"#111827", color:"#fff", border:"none", borderRadius:"0 8px 8px 0", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              Search
            </button>
          </form>

          {/* Category chips + year filter */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:20 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setParams(p => ({ ...p, category: cat.value, page:1 }))}
                style={{
                  padding:"7px 16px", borderRadius:20, fontSize:13, fontWeight:500, cursor:"pointer",
                  border: params.category === cat.value ? "none" : "1px solid #e5e7eb",
                  background: params.category === cat.value ? "#111827" : "#fff",
                  color: params.category === cat.value ? "#fff" : "#374151",
                }}>
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
          </div>

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
        </main>
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
    </div>
  );
}
