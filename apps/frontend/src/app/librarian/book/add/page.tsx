"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { BookMarked, Loader2, ArrowLeft, Upload, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCreateCatalogItem } from "@/features/library/hooks/useLibrary";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn, formatFileSize } from "@/lib/utils";

const CATEGORIES = [
  "General", "Textbook", "Reference", "Novel", "Non-Fiction", "Science", "Technology",
  "Mathematics", "History", "Social Sciences", "Humanities", "Journal", "Magazine", "Other",
];

// Librarians have the same authority over library books that archivists have
// over archive items — including setting/viewing "restricted", subject to the
// same request/approve/deny flow for everyone below that tier.
const ACCESS_TIERS = [
  { value: "public",     label: "Public — visible to everyone" },
  { value: "member",     label: "Member — signed-in users" },
  { value: "staff",      label: "Staff — researchers, librarians, admins" },
  { value: "restricted", label: "Restricted — approval required" },
];

const schema = z.object({
  title:          z.string().min(1, "Title is required"),
  isbn:           z.string().optional(),
  authors:        z.string().optional(),
  publisher:      z.string().optional(),
  edition:        z.string().optional(),
  year:           z.string().optional(),
  category:       z.string().min(1, "Category is required"),
  total_copies:   z.string().min(1, "Total copies is required"),
  shelf_location: z.string().optional(),
  description:    z.string().optional(),
  access_tier:    z.enum(["public", "member", "staff", "restricted"]),
});

type FormValues = z.infer<typeof schema>;

export default function AddBookPage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const { mutateAsync: addCatalogItem, isPending: isAddingBook } = useCreateCatalogItem();

  const [pdfFile, setPdfFile]   = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string>("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "General",
      total_copies: "1",
      access_tier: "public",
    },
  });

  // PDF Dropzone
  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setPdfError("");
    if (rejected.length > 0) {
      setPdfError(rejected[0].errors[0]?.message ?? "Invalid file");
      return;
    }
    if (accepted[0]) setPdfFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const onSubmit = async (data: FormValues) => {
    const fd = new FormData();
    fd.append("title",          data.title.trim());
    if (data.isbn) fd.append("isbn", data.isbn.trim());
    fd.append(
      "authors",
      JSON.stringify(data.authors ? data.authors.split(",").map((a) => a.trim()).filter(Boolean) : [])
    );
    if (data.publisher) fd.append("publisher", data.publisher.trim());
    if (data.edition) fd.append("edition", data.edition.trim());
    if (data.year) fd.append("year", data.year);
    fd.append("category",       data.category);
    fd.append("total_copies",   data.total_copies);
    fd.append("access_tier",    data.access_tier);
    if (data.shelf_location) fd.append("shelf_location", data.shelf_location.trim());
    if (data.description) fd.append("description", data.description.trim());
    if (pdfFile) fd.append("file", pdfFile);

    try {
      const created = await addCatalogItem(fd);
      toast.success(
        created?.barcode
          ? `Book added! Barcode: ${created.barcode}`
          : "Book added to library catalog successfully!"
      );
      setTimeout(() => {
        router.push("/librarian");
      }, 1200);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to add book. Please try again.");
    }
  };

  // Guard
  if (!ready || !["librarian", "admin"].includes(user?.role ?? "")) {
    if (ready) router.push("/");
    return null;
  }

  return (
    <AppLayout>
      <div className="page-container py-8 max-w-3xl">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Add Book to Catalog</span>}
          subtitle="Fill in the book details to expand the library database catalog"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Librarian", href: "/librarian" },
            { label: "Add Book" },
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Section 1: Book Information ─────────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm">Book Details</h3>
            </div>
            <div className="gh-box-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Book Title"
                  required
                  placeholder="e.g. Introduction to Algorithms"
                  error={errors.title?.message}
                  {...register("title")}
                />
                <Input
                  label="ISBN"
                  placeholder="e.g. 978-0-262-03384-8"
                  error={errors.isbn?.message}
                  {...register("isbn")}
                />
              </div>

              <Input
                label="Authors / Contributors"
                placeholder="Author 1, Author 2, ..."
                hint="Separated by comma"
                error={errors.authors?.message}
                {...register("authors")}
              />

              <Textarea
                label="Description / Summary"
                rows={4}
                placeholder="Provide a summary or brief description of the book content…"
                error={errors.description?.message}
                {...register("description")}
              />
            </div>
          </section>

          {/* ── Section 2: Publishing & Inventory ─────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm">Publishing & Location Details</h3>
            </div>
            <div className="gh-box-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Publisher"
                  placeholder="e.g. MIT Press"
                  error={errors.publisher?.message}
                  {...register("publisher")}
                />
                <Input
                  label="Edition"
                  placeholder="e.g. 3rd"
                  error={errors.edition?.message}
                  {...register("edition")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Year of Publication"
                  type="number"
                  placeholder="e.g. 2023"
                  error={errors.year?.message}
                  {...register("year")}
                />
                <Select
                  label="Category"
                  required
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  error={errors.category?.message}
                  {...register("category")}
                />
                <Input
                  label="Total Copies"
                  type="number"
                  required
                  min="1"
                  error={errors.total_copies?.message}
                  {...register("total_copies")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Shelf Location"
                  placeholder="e.g. A-12, Floor 2"
                  error={errors.shelf_location?.message}
                  {...register("shelf_location")}
                />
                <Select
                  label="Access Tier"
                  required
                  options={ACCESS_TIERS}
                  error={errors.access_tier?.message}
                  {...register("access_tier")}
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: PDF Document (Optional) ─────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm flex items-center gap-2">
                <Upload size={16} /> Book Document / PDF (Optional)
              </h3>
            </div>
            <div className="gh-box-body space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-[var(--avatar-theme-color,#3b82f6)] bg-blue-50/20"
                    : pdfFile
                    ? "border-emerald-500 bg-emerald-50/10"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
              >
                <input {...getInputProps()} disabled={isAddingBook} />
                {pdfFile ? (
                  <div className="flex items-center gap-3.5 p-1">
                    <FileText size={28} className="text-emerald-500" />
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-800 truncate">{pdfFile.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(pdfFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto mb-3 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-700">Drag & drop PDF here, or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Accepts PDF file up to 20 MB</p>
                  </div>
                )}
              </div>

              {pdfError && (
                <p className="text-xs text-red-600 font-medium">{pdfError}</p>
              )}
            </div>
          </section>

          {/* ── Actions ───────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => router.push("/librarian")}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              disabled={isAddingBook}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingBook}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white transition-all shadow-md"
              style={{
                background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
              }}
            >
              {isAddingBook ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Adding Book…
                </>
              ) : (
                <>
                  <BookMarked size={15} />
                  Add Book
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
