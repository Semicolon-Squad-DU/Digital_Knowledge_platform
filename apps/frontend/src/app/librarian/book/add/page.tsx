"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookMarked, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useCreateCatalogItem } from "@/features/library/hooks/useLibrary";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";

const CATEGORIES = [
  "General", "Textbook", "Reference", "Fiction", "Non-Fiction", "Science", "Technology", "Mathematics", "History", "Other",
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
});

type FormValues = z.infer<typeof schema>;

export default function AddBookPage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const { mutateAsync: addCatalogItem, isPending: isAddingBook } = useCreateCatalogItem();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "General",
      total_copies: "1",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await addCatalogItem({
        title:          data.title.trim(),
        isbn:           data.isbn?.trim() || undefined,
        authors:        data.authors ? data.authors.split(",").map((a) => a.trim()).filter(Boolean) : [],
        publisher:      data.publisher?.trim() || undefined,
        edition:        data.edition?.trim() || undefined,
        year:           data.year ? parseInt(data.year) : undefined,
        category:       data.category,
        total_copies:   parseInt(data.total_copies) || 1,
        shelf_location: data.shelf_location?.trim() || undefined,
        description:    data.description?.trim() || undefined,
      });
      toast.success("Book added to library catalog successfully!");
      setTimeout(() => {
        router.push("/librarian");
      }, 800);
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
      <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Breadcrumb Row */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/librarian")}>Librarian</span>
            <span>/</span>
            <span style={{ color: "#111827", fontWeight: 500 }}>Add Book</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0f1117",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            margin: "0 0 6px",
          }}>
            Add Book to Catalog
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Fill in the book details to add it to the library catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Section 1: Book Information ─────────────────── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
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

          {/* ── Section 2: Publishing & Inventory ─────────────── */}
          <section style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
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

              <Input
                label="Shelf Location"
                placeholder="e.g. A-12, Floor 2"
                error={errors.shelf_location?.message}
                {...register("shelf_location")}
              />
            </div>
          </section>

          {/* ── Actions ───────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.push("/librarian")}
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
                if (!isAddingBook) {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }
              }}
              onMouseOut={(e) => {
                if (!isAddingBook) {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }
              }}
              disabled={isAddingBook}
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
                background: "linear-gradient(135deg, #1a1a2e 0%, #111116 100%)",
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
                  <Loader2 size={14} className="animate-spin" />
                  Adding Book…
                </>
              ) : (
                <>
                  <BookMarked size={14} />
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
