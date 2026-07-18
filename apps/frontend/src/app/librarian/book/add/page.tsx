"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { BookMarked, Loader2, Upload, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useCreateCatalogItem } from "@/features/library/hooks/useLibrary";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatFileSize } from "@/lib/utils";

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

const MAX_PDF_MB = 20;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

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
    maxSize: MAX_PDF_BYTES,
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
  if (!ready || user?.role !== "librarian") {
    if (ready) router.push("/");
    return null;
  }

  return (
    <AppLayout>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: "36px 40px 34px",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookMarked size={19} color="var(--avatar-theme-color, #6366f1)" />
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, letterSpacing: "-0.03em" }}>
                Add Book to Catalog
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Fill in the book details to expand the library database catalog.
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 40px", maxWidth: 800, margin: "0 auto" }}>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Book Details ─────────────────────────────────── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Book Details</h2>
            </div>
            <div style={{ padding: 20 }} className="space-y-4">
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

          {/* ── Publishing & Location Details ─────────────── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Publishing & Location Details</h2>
            </div>
            <div style={{ padding: 20 }} className="space-y-4">
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

          {/* ── Book Document / PDF ─────────────────────────────── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                Book Document / PDF
                <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>(optional)</span>
              </h2>
            </div>
            <div style={{ padding: 20 }}>
              {pdfFile ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}>
                  <FileText size={20} color="var(--avatar-theme-color, #2563eb)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pdfFile.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>
                      {formatFileSize(pdfFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    style={{
                      padding: 4,
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                      e.currentTarget.style.color = "#dc2626";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }}
                    aria-label="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  style={{
                    border: "2px dashed #d1d5db",
                    borderRadius: 8,
                    padding: "32px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragActive ? "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 8%, transparent)" : "#fff",
                    borderColor: isDragActive ? "var(--avatar-theme-color, #2563eb)" : "#d1d5db",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = "var(--avatar-theme-color, #2563eb)";
                      e.currentTarget.style.background = "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 4%, transparent)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "#fff";
                    }
                  }}
                >
                  <input {...getInputProps()} disabled={isAddingBook} aria-label="Upload book PDF" />
                  <Upload
                    size={24}
                    color={isDragActive ? "var(--avatar-theme-color, #2563eb)" : "#6b7280"}
                    style={{ margin: "0 auto 12px" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", margin: 0 }}>
                    {isDragActive ? "Drop your PDF here" : "Drag & drop your book PDF"}
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginBottom: 0 }}>
                    or <span style={{ color: "var(--avatar-theme-color, #2563eb)", fontWeight: 500 }}>browse to upload</span> · PDF only · max {MAX_PDF_MB} MB
                  </p>
                </div>
              )}
              {pdfError && <p className="form-error mt-2">{pdfError}</p>}
            </div>
          </section>

          {/* ── Actions ────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push("/librarian")}
              disabled={isAddingBook}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: isAddingBook ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#6b7280",
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingBook}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                border: "none",
                borderRadius: 8,
                cursor: isAddingBook ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                opacity: isAddingBook ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!isAddingBook) {
                  e.currentTarget.style.filter = "brightness(1.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!isAddingBook) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
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
      </div>
    </AppLayout>
  );
}
