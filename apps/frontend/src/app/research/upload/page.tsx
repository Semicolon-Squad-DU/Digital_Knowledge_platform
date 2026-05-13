"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Plus, Trash2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSubmitResearchOutput } from "@/hooks/useResearch";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatFileSize } from "@/lib/utils";

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
  year: z.string().optional(),
  doi: z.string().optional(),
  journal_name: z.string().optional(),
  keywords_raw: z.string().optional(),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UploadResearchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
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
      authors: [{ name: user?.name ?? "", email: user?.email ?? "", affiliation: "" }],
    },
  });

  const authors = watch("authors");
  const outputType = watch("output_type");

  const addAuthor = () => setValue("authors", [...authors, { name: "", email: "", affiliation: "" }]);
  const removeAuthor = (i: number) => setValue("authors", authors.filter((_, idx) => idx !== i));

  // Dropzone
  const onDrop = useCallback((accepted: File[], rejected: { errors: { message: string }[] }[]) => {
    setPdfError("");
    if (rejected.length > 0) { setPdfError(rejected[0].errors[0]?.message ?? "Invalid file"); return; }
    if (accepted[0]) setPdfFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  // Submit
  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("output_type", values.output_type);
    fd.append("abstract", values.abstract);
    fd.append("authors", JSON.stringify(values.authors));
    fd.append("keywords", JSON.stringify(
      values.keywords_raw
        ? values.keywords_raw.split(",").map(k => k.trim()).filter(Boolean)
        : []
    ));
    if (values.year) fd.append("published_date", `${values.year}-01-01`);
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

  // Guard
  if (user && !["researcher", "admin"].includes(user.role)) {
    return (
      <div className="page-container py-16 text-center">
        <FlaskConical size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
        <p className="font-semibold text-lg text-[var(--color-fg-default)]">Access Restricted</p>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">Only researchers can upload research outputs.</p>
      </div>
    );
  }

  const showJournal = ["journal", "conference"].includes(outputType);

  return (
    <div className="page-container py-8 max-w-3xl">
      <PageHeader
        title="Upload Research Output"
        subtitle="Submit your research for the DKP repository"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Research", href: "/research" },
          { label: "Upload" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Type + Title ─────────────────────────────── */}
        <section className="gh-box">
          <div className="gh-box-header">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">Basic Information</h2>
          </div>
          <div className="gh-box-body space-y-4">
            <Select
              label="Output Type"
              required
              options={OUTPUT_TYPES}
              error={errors.output_type?.message}
              {...register("output_type")}
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
                label="Year"
                type="number"
                placeholder="e.g. 2024"
                {...register("year")}
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
        <section className="gh-box">
          <div className="gh-box-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              Authors
              <span className="ml-2 text-xs font-normal text-[var(--color-fg-muted)]">({authors.length})</span>
            </h2>
            <Button type="button" variant="outline" size="sm" icon={<Plus size={13} />} onClick={addAuthor}>
              Add Author
            </Button>
          </div>
          <div className="gh-box-body space-y-4">
            {errors.authors?.root && (
              <p className="form-error">{errors.authors.root.message}</p>
            )}
            {authors.map((_, idx) => (
              <div key={idx} className="relative rounded-md border border-[var(--color-border-default)] p-4 bg-[var(--color-canvas-subtle)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide">
                    Author {idx + 1}
                  </span>
                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAuthor(idx)}
                      className="p-1 rounded text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] transition-colors"
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

        {/* ── PDF Upload ───────────────────────────────── */}
        <section className="gh-box">
          <div className="gh-box-header">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              PDF Upload
              <span className="ml-1.5 text-xs font-normal text-[var(--color-fg-muted)]">(optional)</span>
            </h2>
          </div>
          <div className="gh-box-body">
            {pdfFile ? (
              <div className="flex items-center gap-3 p-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
                <FileText size={20} className="text-[var(--color-accent-fg)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-fg-default)] truncate">{pdfFile.name}</p>
                  <p className="text-xs text-[var(--color-fg-muted)]">{formatFileSize(pdfFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="p-1 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                  aria-label="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]"
                    : "border-[var(--color-border-default)] hover:border-[var(--color-accent-fg)] hover:bg-[var(--color-canvas-subtle)]"
                )}
              >
                <input {...getInputProps()} aria-label="Upload PDF" />
                <Upload size={24} className={cn("mx-auto mb-3", isDragActive ? "text-[var(--color-accent-fg)]" : "text-[var(--color-fg-muted)]")} />
                <p className="text-sm font-medium text-[var(--color-fg-default)]">
                  {isDragActive ? "Drop your PDF here" : "Drag & drop your PDF"}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                  or <span className="text-[var(--color-accent-fg)]">browse to upload</span> · PDF only · max 500 MB
                </p>
              </div>
            )}
            {pdfError && <p className="form-error mt-2">{pdfError}</p>}
            {pdfFile && <LocalPdfPreview file={pdfFile} />}
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button type="button" variant="invisible" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting || submit.isPending}
            icon={<FlaskConical size={15} />}
          >
            Submit Research Output
          </Button>
        </div>

      </form>
    </div>
  );
}
