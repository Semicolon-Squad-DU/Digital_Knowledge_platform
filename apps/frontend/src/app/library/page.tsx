"use client";

import { useState, useCallback } from "react";
import { Search, BookOpen, Plus, Trash2, BookMarked, Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCatalogSearch, useAddCatalogItem, useDeleteCatalogItem } from "@/hooks/useLibrary";
import { useAuthStore } from "@/store/auth.store";
import { CatalogCard } from "@/components/library/CatalogCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn, formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Textbook", "Reference", "Novel", "Journal", "Magazine", "Thesis", "General"];

const AVAILABILITY_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "available", label: "Available" },
  { value: "on_loan",   label: "On Loan" },
] as const;

const BOOK_CATEGORIES = ["General","Textbook","Reference","Fiction","Non-Fiction","Novel","Journal","Magazine","Thesis","Science","Technology","Mathematics","History","Other"];

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const isLibrarian = isAuthenticated && ["librarian", "admin"].includes(user?.role ?? "");

  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState({
    query: "", category: "",
    availability: "all" as "all" | "available" | "on_loan",
    page: 1, limit: 20,
  });

  // Add book modal
  const [addModal, setAddModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bookForm, setBookForm] = useState({
    title: "", isbn: "", authors: "", publisher: "",
    edition: "", year: "", category: "General",
    total_copies: "1", shelf_location: "", description: "",
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setPdfFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");

  const { data, isLoading, isError, refetch } = useCatalogSearch(params);
  const { mutateAsync: addBook, isPending: isAdding } = useAddCatalogItem();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteCatalogItem();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, query: searchInput, page: 1 }));
  };

  const handleAddBook = async () => {
    if (!bookForm.title.trim()) { toast.error("Title is required"); return; }
    if (!bookForm.total_copies || parseInt(bookForm.total_copies) < 1) { toast.error("At least 1 copy required"); return; }
    try {
      const fd = new FormData();
      fd.append("title",         bookForm.title.trim());
      fd.append("isbn",          bookForm.isbn.trim());
      fd.append("authors",       JSON.stringify(bookForm.authors ? bookForm.authors.split(",").map(a => a.trim()).filter(Boolean) : []));
      fd.append("publisher",     bookForm.publisher.trim());
      fd.append("edition",       bookForm.edition.trim());
      fd.append("year",          bookForm.year);
      fd.append("category",      bookForm.category);
      fd.append("total_copies",  bookForm.total_copies);
      fd.append("shelf_location",bookForm.shelf_location.trim());
      fd.append("description",   bookForm.description.trim());
      if (pdfFile) fd.append("file", pdfFile);

      await addBook(fd);
      toast.success("Book added to catalog!");
      setAddModal(false);
      setPdfFile(null);
      setBookForm({ title: "", isbn: "", authors: "", publisher: "", edition: "", year: "", category: "General", total_copies: "1", shelf_location: "", description: "" });
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to add book");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBook(deleteId);
      toast.success("Book removed from catalog");
      setDeleteId(null);
      refetch();
    } catch {
      toast.error("Failed to remove book");
    }
  };

  return (
    <div className="page-container py-8">
      <PageHeader
        title="Library Catalog"
        subtitle="Search books, check availability, and manage your borrowing"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Library" }]}
        actions={isLibrarian ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setAddModal(true)}
          >
            Add Book
          </Button>
        ) : undefined}
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="search-bar flex-1">
          <Search className="search-bar-icon" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, or ISBN…"
            className="form-input pl-10"
            aria-label="Search library catalog"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-[var(--color-canvas-subtle)] rounded-xl p-1" role="group" aria-label="Filter by availability">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParams((p) => ({ ...p, availability: opt.value, page: 1 }))}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                params.availability === opt.value
                  ? "bg-[var(--color-canvas-default)] text-[var(--color-fg-default)] shadow-sm"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
              )}
              aria-pressed={params.availability === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => {
            const active = (cat === "All" && !params.category) || params.category === cat;
            return (
              <button
                key={cat}
                onClick={() => setParams((p) => ({ ...p, category: cat === "All" ? "" : cat, page: 1 }))}
                className={cn("filter-chip", active && "filter-chip-active")}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-4 min-h-[1.5rem]">
        {!isLoading && data && (
          <p className="text-sm text-[var(--color-fg-muted)]">
            <span className="font-medium text-[var(--color-fg-default)]">{data.total.toLocaleString()}</span> books found
          </p>
        )}
        {isLoading && <p className="text-sm text-[var(--color-fg-muted)]">Searching…</p>}
      </div>

      {isError && <div className="alert alert-danger mb-4" role="alert">Failed to load catalog. Please try again.</div>}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && !isError && data?.items?.length === 0 && (
        <EmptyState
          icon={<BookOpen size={26} />}
          title="No books found"
          description={isLibrarian ? "Add books using the \"Add Book\" button above." : "Try different search terms or clear the filters."}
          action={isLibrarian ? { label: "Add Book", onClick: () => setAddModal(true), variant: "primary" } : {
            label: "Clear filters",
            onClick: () => { setParams({ query: "", category: "", availability: "all", page: 1, limit: 20 }); setSearchInput(""); },
            variant: "outline",
          }}
        />
      )}

      {!isLoading && data?.items && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.items.map((item: Parameters<typeof CatalogCard>[0]["item"]) => (
              <div key={item.catalog_id} className="relative group">
                <CatalogCard item={item} />
                {isLibrarian && (
                  <button
                    onClick={() => { setDeleteId(item.catalog_id); setDeleteTitle(item.title); }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-danger-emphasis)] hover:text-white"
                    aria-label={`Remove ${item.title}`}
                    title="Remove from catalog"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              page={params.page}
              totalPages={data.total_pages}
              total={data.total}
              limit={params.limit}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </div>
        </>
      )}

      {/* Add Book Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add Book to Catalog"
        description="Fill in the book details to add it to the library catalog."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Introduction to Algorithms"
            />
            <Input
              label="ISBN"
              value={bookForm.isbn}
              onChange={(e) => setBookForm(f => ({ ...f, isbn: e.target.value }))}
              placeholder="e.g. 978-0-262-03384-8"
            />
          </div>
          <Input
            label="Authors"
            value={bookForm.authors}
            onChange={(e) => setBookForm(f => ({ ...f, authors: e.target.value }))}
            placeholder="Author 1, Author 2, ..."
            hint="Comma-separated"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Publisher"
              value={bookForm.publisher}
              onChange={(e) => setBookForm(f => ({ ...f, publisher: e.target.value }))}
              placeholder="e.g. MIT Press"
            />
            <Input
              label="Edition"
              value={bookForm.edition}
              onChange={(e) => setBookForm(f => ({ ...f, edition: e.target.value }))}
              placeholder="e.g. 3rd"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Year"
              type="number"
              value={bookForm.year}
              onChange={(e) => setBookForm(f => ({ ...f, year: e.target.value }))}
              placeholder="e.g. 2023"
            />
            <div className="space-y-1.5">
              <label className="form-label">Category</label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm(f => ({ ...f, category: e.target.value }))}
                className="form-select"
              >
                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input
              label="Total Copies"
              type="number"
              required
              min="1"
              value={bookForm.total_copies}
              onChange={(e) => setBookForm(f => ({ ...f, total_copies: e.target.value }))}
            />
          </div>
          <Input
            label="Shelf Location"
            value={bookForm.shelf_location}
            onChange={(e) => setBookForm(f => ({ ...f, shelf_location: e.target.value }))}
            placeholder="e.g. A-12, Floor 2"
          />
          <div className="space-y-1.5">
            <label className="form-label">Description</label>
            <textarea
              value={bookForm.description}
              onChange={(e) => setBookForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="form-textarea"
              placeholder="Brief description of the book..."
            />
          </div>
          {/* PDF Upload */}
          <div>
            <label className="form-label">Book PDF <span className="text-[var(--color-fg-muted)] font-normal">(optional)</span></label>
            {pdfFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
                <FileText size={18} className="text-[var(--color-accent-fg)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-fg-default)] truncate">{pdfFile.name}</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">{formatFileSize(pdfFile.size)}</p>
                </div>
                <button type="button" onClick={() => setPdfFile(null)}
                  className="p-1 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)]">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div {...getRootProps()} className={cn(
                "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]"
                  : "border-[var(--color-border-default)] hover:border-[var(--color-accent-fg)] hover:bg-[var(--color-canvas-subtle)]"
              )}>
                <input {...getInputProps()} />
                <Upload size={20} className="mx-auto mb-1.5 text-[var(--color-fg-muted)]" />
                <p className="text-sm text-[var(--color-fg-default)]">
                  {isDragActive ? "Drop PDF here" : "Drag & drop book PDF or click to browse"}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">PDF only · max 500 MB</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border-muted)]">
            <Button variant="invisible" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddBook} loading={isAdding} icon={<BookMarked size={14} />}>
              Add to Catalog
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Book"
        description={`Remove "${deleteTitle}" from the catalog? This action soft-deletes the book and can be reversed by an admin.`}
        confirmLabel="Remove"
        loading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
