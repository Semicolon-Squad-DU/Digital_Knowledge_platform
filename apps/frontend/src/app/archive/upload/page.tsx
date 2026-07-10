"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import {
  Upload, X, FileText, Plus, Trash2, ArrowLeft, Archive, AlertCircle,
  Tag, Clock, Loader2, CheckCircle2, Files, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUploadArchiveItem, useFinalizeArchiveUpload, useTags, useBulkUploadArchiveItems, BulkUploadResult } from "@/features/archive/hooks/useArchive";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { cn, formatFileSize } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { uploadViaTus, TUS_SIZE_THRESHOLD } from "@/lib/tusUpload";

const CATEGORIES = [
  "General", "Research", "Thesis", "Report", "Lecture Notes", "Lab Manual", "Policy", "Other",
];

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "audio/mpeg": [".mp3"],
  "video/mp4": [".mp4"],
};
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;

const STATUS_FLOW = ["draft", "review", "published", "archived"] as const;
type ArchiveStatus = typeof STATUS_FLOW[number];

const schema = z.object({
  title_en:    z.string().min(1, "English title is required"),
  title_bn:    z.string().optional(),
  description: z.string().optional(),
  authors:     z.string().optional(),
  category:    z.string().min(1, "Category is required"),
  language:    z.enum(["en", "bn", "both"]),
  access_tier: z.enum(["public", "member", "staff", "restricted"]),
  status:      z.enum(["draft", "review", "published", "archived"]),
});

type FormValues = z.infer<typeof schema>;

function LocalPdfPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useState(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  });

  if (!url) return null;

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-[var(--color-border-default)] shadow-sm bg-white">
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

export default function UploadArchivePage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const { mutateAsync: upload } = useUploadArchiveItem();
  const { mutateAsync: finalizeUpload } = useFinalizeArchiveUpload();
  const { mutateAsync: bulkUpload, isPending: isBulkUploading } = useBulkUploadArchiveItems();
  const { data: availableTags } = useTags();

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkUploadResult[] | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const tusAbortRef = useRef<(() => void) | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      access_tier: "public",
      language: "en",
      category: "General",
      status: "published",
    },
  });

  const currentStatus = watch("status");

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setFileError("");
    if (rejected.length > 0) {
      const msg = rejected[0].errors[0]?.message ?? "Invalid file";
      setFileError(msg.includes("size") ? "File too large — max 500 MB" : msg);
      return;
    }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_UPLOAD_SIZE,
    multiple: false,
  });

  const onDropBulk = useCallback((accepted: File[], rejected: any[]) => {
    setFileError("");
    setBulkResults(null);
    if (rejected.length > 0) {
      const msg = rejected[0].errors[0]?.message ?? "Invalid file";
      setFileError(msg.includes("size") ? "One or more files exceed the 500 MB limit" : msg);
    }
    if (accepted.length > 0) setBulkFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({
    onDrop: onDropBulk,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_UPLOAD_SIZE,
    multiple: true,
  });

  const removeBulkFile = (index: number) => setBulkFiles((prev) => prev.filter((_, i) => i !== index));

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) { toast.error("Please select at least one file"); return; }
    try {
      const { results, succeeded, failed } = await bulkUpload(bulkFiles);
      setBulkResults(results);
      setBulkFiles([]);
      if (failed === 0) {
        toast.success(`${succeeded} file${succeeded === 1 ? "" : "s"} uploaded successfully!`);
      } else {
        toast.error(`${succeeded} uploaded, ${failed} failed — see details below`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Bulk upload failed. Please try again.");
    }
  };

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((t) => [...t, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setSelectedTags((t) => t.filter((x) => x !== tag));

  const onSubmit = async (data: FormValues) => {
    if (!file) { toast.error("Please select a file"); return; }

    setUploading(true);
    setProgress(0);
    abortRef.current = new AbortController();

    const authorsJson = JSON.stringify(
      data.authors ? data.authors.split(",").map((a) => a.trim()).filter(Boolean) : []
    );
    const tagsJson = selectedTags.length > 0 ? JSON.stringify(selectedTags) : undefined;
    const metaObj: Record<string, string> = {};
    customFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        metaObj[f.key.trim()] = f.value.trim();
      }
    });

    // Large files go over the resumable tus protocol so a dropped connection
    // doesn't mean starting a 500 MB upload over again; small files use the
    // simpler direct multipart route.
    if (file.size > TUS_SIZE_THRESHOLD) {
      const { promise, abort } = uploadViaTus(file, setProgress);
      tusAbortRef.current = abort;

      try {
        const fileKey = await promise;
        await finalizeUpload({
          file_key: fileKey, file_type: file.type, file_size: file.size,
          title_en: data.title_en, title_bn: data.title_bn || undefined,
          description: data.description || undefined, category: data.category,
          language: data.language, access_tier: data.access_tier, status: data.status,
          authors: authorsJson, tags: tagsJson, custom_metadata: JSON.stringify(metaObj),
        });
        setProgress(100);
        toast.success("Document uploaded to digital archive successfully!");
        setTimeout(() => router.push("/archive"), 800);
      } catch (err: unknown) {
        setProgress(0);
        setUploading(false);
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || "Upload failed. Please try again.");
      }
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title_en",    data.title_en);
    fd.append("title_bn",    data.title_bn    || "");
    fd.append("description", data.description || "");
    fd.append("category",    data.category);
    fd.append("language",    data.language);
    fd.append("access_tier", data.access_tier);
    fd.append("status",      data.status);
    fd.append("authors",     authorsJson);
    if (tagsJson) fd.append("tags", tagsJson);
    fd.append("custom_metadata", JSON.stringify(metaObj));

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 85));
    }, 300);

    try {
      await upload(fd);
      clearInterval(progressInterval);
      setProgress(100);
      toast.success("Document uploaded to digital archive successfully!");
      setTimeout(() => {
        router.push("/archive");
      }, 800);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setProgress(0);
      setUploading(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Upload failed. Please try again.");
    }
  };

  // Guard — wait for auth rehydration before deciding, so the form never
  // flashes on screen for a non-archivist user during the initial render.
  if (!ready) return null;
  if (user && user.role !== "archivist") {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <Archive size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Access Restricted</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">Only archivists can upload archive documents.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container py-8 max-w-3xl">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Upload Archive Document</span>}
          subtitle="Add historic documents, maps, institutional papers or research data to the repository"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Archive", href: "/archive" },
            { label: "Upload" },
          ]}
        />

        {/* ── Single / Bulk mode toggle ─────────────────── */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
              mode === "single"
                ? "border-[var(--avatar-theme-color,#1a1a2e)] text-white"
                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            )}
            style={mode === "single" ? { background: "var(--theme-gradient-160, #1a1a2e)" } : undefined}
          >
            <FileText size={14} /> Single Document
          </button>
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
              mode === "bulk"
                ? "border-[var(--avatar-theme-color,#1a1a2e)] text-white"
                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            )}
            style={mode === "bulk" ? { background: "var(--theme-gradient-160, #1a1a2e)" } : undefined}
          >
            <Files size={14} /> Bulk Upload
          </button>
        </div>

        {mode === "bulk" ? (
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm flex items-center gap-2">
                <Files size={16} /> Bulk File Upload
              </h3>
            </div>
            <div className="gh-box-body space-y-4">
              <p className="text-xs text-slate-500 -mt-1">
                Each file is added as its own archive item, titled from its filename, in the <strong>General</strong> category
                with <strong>Members Only</strong> access. Edit titles, categories and access tiers afterwards from the archive list.
              </p>

              <div
                {...getBulkRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isBulkDragActive
                    ? "border-[var(--avatar-theme-color,#3b82f6)] bg-blue-50/20"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
              >
                <input {...getBulkInputProps()} aria-label="Upload files" />
                <div className="py-4">
                  <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">
                    {isBulkDragActive ? "Drop files here to add them" : "Drag & drop multiple files or click to browse"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, DOCX, PPTX, Images, MP3, MP4 — Max 500 MB per file, up to 50 files
                  </p>
                </div>
              </div>

              {fileError && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">
                  <AlertCircle size={13} /> {fileError}
                </p>
              )}

              {bulkFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {bulkFiles.length} file{bulkFiles.length === 1 ? "" : "s"} selected
                  </p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {bulkFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                        <FileText size={16} className="text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                          <p className="text-[11px] text-slate-400">{formatFileSize(f.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBulkFile(i)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkResults && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upload Results</p>
                  {bulkResults.map((r, i) => (
                    <div key={`${r.filename}-${i}`} className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold",
                      r.status === "success" ? "bg-emerald-50/50 border-emerald-200 text-emerald-700" : "bg-red-50/50 border-red-200 text-red-700"
                    )}>
                      {r.status === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span className="truncate flex-1">{r.filename}</span>
                      {r.status === "error" && <span className="font-normal text-red-500">{r.error}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="default" onClick={() => router.push("/archive")} disabled={isBulkUploading}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={bulkFiles.length === 0 || isBulkUploading}
                  style={{
                    background: (bulkFiles.length === 0 || isBulkUploading)
                      ? "linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 100%)"
                      : "var(--theme-gradient-160, linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e), #3b82f6))",
                    color: (bulkFiles.length === 0 || isBulkUploading) ? "#94a3b8" : "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: (bulkFiles.length === 0 || isBulkUploading) ? "not-allowed" : "pointer",
                  }}
                >
                  {isBulkUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading {bulkFiles.length} File{bulkFiles.length === 1 ? "" : "s"}…
                    </>
                  ) : (
                    <>
                      <Files size={14} />
                      Upload {bulkFiles.length || ""} File{bulkFiles.length === 1 ? "" : "s"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── File Selection & Preview ─────────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm flex items-center gap-2">
                <Upload size={16} /> File Upload
              </h3>
            </div>
            <div className="gh-box-body space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-[var(--avatar-theme-color,#3b82f6)] bg-blue-50/20"
                    : file
                    ? "border-emerald-500 bg-emerald-50/10"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
              >
                <input {...getInputProps()} aria-label="Upload file" />
                {file ? (
                  <div className="flex items-center gap-3.5 p-1">
                    <FileText size={28} className="text-emerald-500" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      {isDragActive ? "Drop file here to upload" : "Drag & drop your file or click to browse"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, DOCX, PPTX, Images, MP3, MP4 — Max 500 MB
                    </p>
                  </div>
                )}
              </div>

              {fileError && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">
                  <AlertCircle size={13} /> {fileError}
                </p>
              )}

              {/* PDF Preview (Local Preview) */}
              {file && file.type === "application/pdf" && (
                <LocalPdfPreview file={file} />
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" /> Uploading to storage…
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        background: "var(--theme-gradient-160, linear-gradient(135deg, var(--avatar-theme-color,#1a1a2e) 0%, #3b82f6 100%))",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Metadata & Titles ────────────────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm">Document Metadata</h3>
            </div>
            <div className="gh-box-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="English Title"
                  required
                  placeholder="e.g. Historic Charter of the Institute"
                  error={errors.title_en?.message}
                  {...register("title_en")}
                />
                <Input
                  label="বাংলা শিরোনাম (ঐচ্ছিক)"
                  placeholder="যেমন: ইনস্টিটিউটের ঐতিহাসিক সনদপত্র"
                  className="bangla"
                  {...register("title_bn")}
                />
              </div>

              <Input
                label="Authors / Contributors"
                placeholder="Author 1, Author 2, ..."
                hint="Separated by comma"
                {...register("authors")}
              />

              <Textarea
                label="Description / Summary"
                rows={4}
                placeholder="Provide a detailed description, summary or historical context of the archive document…"
                {...register("description")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Category"
                  required
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  error={errors.category?.message}
                  {...register("category")}
                />
                <Select
                  label="Language"
                  options={[
                    { value: "en",   label: "English" },
                    { value: "bn",   label: "বাংলা" },
                    { value: "both", label: "Bilingual" },
                  ]}
                  {...register("language")}
                />
                <Select
                  label="Access Tier"
                  options={[
                    { value: "public",     label: "🌐 Public (All Visitors)" },
                    { value: "member",     label: "👤 Members Only (Registered)" },
                    { value: "staff",      label: "🔒 Staff Only (Archivist/Librarian)" },
                    { value: "restricted", label: "🚫 Restricted Access Requests" },
                  ]}
                  {...register("access_tier")}
                />
              </div>
            </div>
          </section>

          {/* ── Status Lifecycle & Tags ──────────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm">Status & Classification</h3>
            </div>
            <div className="gh-box-body space-y-6">
              
              {/* Lifecycle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Status Workflow Lifecycle</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {STATUS_FLOW.map((s, i) => {
                    const isActive  = currentStatus === s;
                    const isPast    = STATUS_FLOW.indexOf(currentStatus as ArchiveStatus) > i;
                    const icons: Record<ArchiveStatus, React.ReactNode> = {
                      draft:     <Clock size={13} />,
                      review:    <Loader2 size={13} className={isActive ? "animate-spin" : ""} />,
                      published: <CheckCircle2 size={13} />,
                      archived:  <AlertCircle size={13} />,
                    };
                    return (
                      <label
                        key={s}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all",
                          isActive
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                            : isPast
                            ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        )}
                      >
                        <input type="radio" value={s} className="sr-only" {...register("status")} />
                        {icons[s]}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag size={13} /> Document Tags
                </label>
                
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                        style={{ background: "var(--theme-gradient-160, linear-gradient(135deg, #1a1a2e, #3b82f6))" }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:opacity-70 ml-1 p-0.5 hover:bg-white/10 rounded-full"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {availableTags && availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags
                      .filter((t: { name_en: string }) => !selectedTags.includes(t.name_en))
                      .slice(0, 12)
                      .map((t: { tag_id: string; name_en: string }) => (
                        <button
                          key={t.tag_id}
                          type="button"
                          onClick={() => addTag(t.name_en)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 text-slate-600 bg-white hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Plus size={10} /> {t.name_en}
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add a new custom tag and press Enter"
                    className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2 outline-none focus:border-blue-500 transition-colors"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                  >
                    Add Tag
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Custom Metadata fields ───────────────────── */}
          <section className="gh-box">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[var(--color-fg-default)] text-sm">Custom Parameters</h3>
            </div>
            <div className="gh-box-body space-y-4">
              {customFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customFields.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="min-w-0">
                        <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">{f.key}</span>
                        <span className="text-xs font-semibold text-slate-700 truncate block mt-0.5">{f.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Attribute Key (e.g. Material)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2 outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Parchment)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2 outline-none focus:border-blue-500 transition-colors"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newKey.trim() && newValue.trim()) {
                      setCustomFields((prev) => [...prev, { key: newKey.trim(), value: newValue.trim() }]);
                      setNewKey("");
                      setNewValue("");
                    }
                  }}
                >
                  Add Parameter
                </Button>
              </div>
            </div>
          </section>

          {/* ── Actions ───────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-6">
            <Button type="button" variant="default" onClick={() => router.push("/archive")} disabled={uploading}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!file || uploading}
              style={{
                background: (!file || uploading)
                  ? "linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 100%)"
                  : "var(--theme-gradient-160, linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e), #3b82f6))",
                color: (!file || uploading) ? "#94a3b8" : "#ffffff",
                border: "none",
                borderRadius: "8px",
                boxShadow: (!file || uploading) ? "none" : "0 4px 14px rgba(26, 26, 46, 0.2)",
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: (!file || uploading) ? "not-allowed" : "pointer",
                transition: "all 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                if (file && !uploading) {
                  e.currentTarget.style.filter = "brightness(1.08)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (file && !uploading) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading {Math.round(progress)}%…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Document
                </>
              )}
            </button>
          </div>

        </form>
        )}
      </div>
    </AppLayout>
  );
}
