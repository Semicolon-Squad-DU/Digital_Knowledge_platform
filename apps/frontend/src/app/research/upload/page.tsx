"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Plus, Trash2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useSubmitResearchOutput } from "@/features/research/hooks/useResearch";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { formatFileSize } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OUTPUT_TYPES = [
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis", label: "Thesis" },
  { value: "dataset", label: "Dataset" },
  { value: "report", label: "Report" },
];

// Mirrors ALLOWED_TIERS_BY_ROLE on the backend — researcher/admin may pick
// any of these; the server re-validates against the caller's actual role.
const ACCESS_TIERS = [
  { value: "public", label: "Public — anyone can view and download" },
  { value: "member", label: "Member — signed-in users only" },
  { value: "staff", label: "Staff — researchers, librarians, archivists, admins only" },
];

/**
 * PDF Preview component for local files
 */
function LocalPdfPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useState(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  });

  if (!url) return null;

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-[var(--color-border-default)] shadow-sm">
      <div className="bg-[var(--color-canvas-subtle)] px-4 py-2 border-b border-[var(--color-border-default)] flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide flex items-center gap-2">
          <FileText size={14} /> Preview: {file.name}
        </span>
      </div>
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        className="w-full"
        style={{ height: "450px" }}
        title="PDF Preview"
      />
    </div>
  );
}


// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  affiliation: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  output_type: z.string().min(1, "Type is required"),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
  published_date: z.string().optional(),
  doi: z.string().optional(),
  journal_name: z.string().optional(),
  keywords_raw: z.string().optional(),
  access_tier: z.string().min(1, "Access level is required"),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UploadResearchPage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const submit = useSubmitResearchOutput();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState("");

  const {
    register, control, handleSubmit, watch,
    formState: { errors, isSubmitting },
    setValue, getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      output_type: "journal",
      access_tier: "public",
      authors: [{ name: user?.name ?? "", email: user?.email ?? "", affiliation: "" }],
    },
  });

  const authors = watch("authors");
  const outputType = watch("output_type");

  const addAuthor = () => setValue("authors", [...authors, { name: "", email: "", affiliation: "" }]);
  const removeAuthor = (i: number) => setValue("authors", authors.filter((_, idx) => idx !== i));

  // Dropzone
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
    accept: {
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
      "application/json": [".json"]
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  // Submit
  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("output_type", values.output_type);
    fd.append("access_tier", values.access_tier);
    fd.append("abstract", values.abstract);
    fd.append("authors", JSON.stringify(values.authors));
    fd.append("keywords", JSON.stringify(
      values.keywords_raw
        ? values.keywords_raw.split(",").map(k => k.trim()).filter(Boolean)
        : []
    ));
    if (values.published_date) {
      fd.append("published_date", values.published_date);
    }
    if (values.doi) fd.append("doi", values.doi);
    if (values.journal_name) fd.append("journal_name", values.journal_name);
    if (pdfFile) fd.append("file", pdfFile);

    try {
      const result = await submit.mutateAsync(fd);
      toast.success("Research output submitted successfully!");
      router.push(`/research/${(result as { output_id: string }).output_id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Submission failed. Please try again.");
    }
  };

  // Guard — wait for auth rehydration first so the form never flashes on
  // screen for a non-researcher user during the initial render.
  if (!ready) return null;
  if (user && user.role !== "researcher") {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <FlaskConical size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Access Restricted</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">Only researchers can upload research outputs.</p>
        </div>
      </AppLayout>
    );
  }

  const showJournal = ["journal", "conference"].includes(outputType);

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
                <FlaskConical size={19} color="var(--avatar-theme-color, #6366f1)" />
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, letterSpacing: "-0.03em" }}>
                Upload Research Output
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              Submit your research for DKP repository.
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 40px", maxWidth: 800, margin: "0 auto" }}>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Basic Information ─────────────────────────── */}
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
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Basic Information</h2>
          </div>
          <div style={{ padding: 20 }} className="space-y-4">
            <Select
              label="Output Type"
              required
              options={OUTPUT_TYPES}
              error={errors.output_type?.message}
              {...register("output_type")}
            />
            <Select
              label="Access Level"
              required
              options={ACCESS_TIERS}
              hint="Who can view and download this output — defaults to Public if left unset"
              error={errors.access_tier?.message}
              {...register("access_tier")}
            />
            <Input
              label="Title"
              required
              placeholder="e.g. Deep Learning Approaches for Bangla NLP"
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="Abstract"
              required
              rows={5}
              placeholder="Summarize your research objectives, methodology, and findings…"
              hint="Minimum 20 characters"
              error={errors.abstract?.message}
              {...register("abstract")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Published Date"
                type="date"
                {...register("published_date")}
              />
              <Input
                label="DOI"
                placeholder="e.g. 10.1000/xyz123"
                {...register("doi")}
              />
            </div>
            {showJournal && (
              <Input
                label={outputType === "conference" ? "Conference Name" : "Journal / Publisher"}
                placeholder={outputType === "conference" ? "e.g. ICML 2024" : "e.g. Nature, IEEE"}
                {...register("journal_name")}
              />
            )}
          </div>
        </section>

        {/* ── Authors ──────────────────────────────────── */}
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
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
              Authors
              <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>({authors.length})</span>
            </h2>
            <button
              type="button"
              onClick={addAuthor}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", background: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 70%, #fff) 100%)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "#fff",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
            >
              <Plus size={13} /> Add Author
            </button>
          </div>
          <div style={{ padding: 20 }} className="space-y-4">
            {errors.authors?.root && (
              <p className="form-error">{errors.authors.root.message}</p>
            )}
            {authors.map((_, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative", borderRadius: 8, border: "1px solid #e5e7eb",
                  padding: 16, background: "#f9fafb",
                  marginBottom: idx === authors.length - 1 ? 0 : 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Author {idx + 1}
                  </span>
                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAuthor(idx)}
                      style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      aria-label={`Remove author ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Dr. Rahim Uddin"
                    error={(errors.authors as { [key: number]: { name?: { message?: string } } })?.[idx]?.name?.message}
                    {...register(`authors.${idx}.name`)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="author@university.edu"
                    {...register(`authors.${idx}.email`)}
                  />
                  <Input
                    label="Affiliation"
                    placeholder="e.g. University of Dhaka"
                    {...register(`authors.${idx}.affiliation`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── File Upload ───────────────────────────────── */}
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
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
              Document / Dataset File Upload
              <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>(optional)</span>
            </h2>
          </div>
          <div style={{ padding: 20 }}>
            {pdfFile ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb",
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
                  style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
                  aria-label="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                style={{
                  border: "2px dashed #d1d5db", borderRadius: 8, padding: "32px 20px", textAlign: "center", cursor: "pointer",
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
                <input {...getInputProps()} aria-label="Upload PDF, ZIP or JSON" />
                <Upload size={24} color={isDragActive ? "var(--avatar-theme-color, #2563eb)" : "#6b7280"} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", margin: 0 }}>
                  {isDragActive ? "Drop your file here" : "Drag & drop your PDF, ZIP or JSON file"}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginBottom: 0 }}>
                  or <span style={{ color: "var(--avatar-theme-color, #2563eb)", fontWeight: 500 }}>browse to upload</span> · PDF, ZIP or JSON · max 500 MB
                </p>
              </div>
            )}
            {pdfError && <p className="form-error mt-2">{pdfError}</p>}
            {pdfFile?.name.toLowerCase().endsWith(".pdf") && <LocalPdfPreview file={pdfFile} />}
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: "#6b7280", transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submit.isPending}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
              background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
              border: "none", borderRadius: 8,
              cursor: (isSubmitting || submit.isPending) ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 600, color: "#fff",
              opacity: (isSubmitting || submit.isPending) ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)", transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (!isSubmitting && !submit.isPending) {
                e.currentTarget.style.filter = "brightness(1.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting && !submit.isPending) {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.transform = "none";
              }
            }}
          >
            <FlaskConical size={15} />
            {isSubmitting || submit.isPending ? "Submitting..." : "Submit Research Output"}
          </button>
        </div>

      </form>
        </div>
      </div>
    </AppLayout>
  );
}
