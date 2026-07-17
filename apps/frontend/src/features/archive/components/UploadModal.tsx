"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, X, FileText, Image as ImageIcon, Music, Video, File,
  AlertCircle, CheckCircle2, Clock, Loader2, Tag, Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useUploadArchiveItem, useTags } from "@/features/archive/hooks/useArchive";
import { formatFileSize, cn } from "@/lib/utils";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/tiff": [".tiff", ".tif"],
  "image/webp": [".webp"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/x-msvideo": [".avi"],
};

const CATEGORIES = [
  "General", "Research", "Thesis", "Dissertation", "Report",
  "Lecture Notes", "Lab Manual", "Policy", "Circular", "Other",
];

const STATUS_FLOW = ["draft", "review", "published", "archived"] as const;
type ArchiveStatus = typeof STATUS_FLOW[number];

interface QueuedUpload {
  id: string;
  fileName: string;
  fileSize: number;
  metadata: Record<string, string>;
  status: "pending" | "uploading" | "done" | "failed";
  addedAt: string;
}

function getQueue(): QueuedUpload[] {
  try {
    return JSON.parse(localStorage.getItem("dkp_upload_queue") || "[]");
  } catch { return []; }
}

function saveQueue(q: QueuedUpload[]) {
  localStorage.setItem("dkp_upload_queue", JSON.stringify(q));
}

function addToQueue(item: Omit<QueuedUpload, "id" | "addedAt" | "status">): QueuedUpload {
  const entry: QueuedUpload = {
    ...item,
    id: crypto.randomUUID(),
    status: "pending",
    addedAt: new Date().toISOString(),
  };
  saveQueue([...getQueue(), entry]);
  return entry;
}

function FileIcon({ mime, size = 20 }: { mime: string; size?: number }) {
  if (mime.startsWith("image/"))  return <ImageIcon  size={size} className="text-purple-500" />;
  if (mime.startsWith("audio/"))  return <Music  size={size} className="text-green-500" />;
  if (mime.startsWith("video/"))  return <Video  size={size} className="text-blue-500" />;
  if (mime.includes("pdf"))       return <FileText size={size} className="text-red-500" />;
  return <File size={size} className="text-slate-400" />;
}

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

type FormData = z.infer<typeof schema>;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile]             = useState<File | null>(null);
  const [fileError, setFileError]   = useState("");
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const abortRef                    = useRef<AbortController | null>(null);

  const { mutateAsync: upload } = useUploadArchiveItem();
  const { data: availableTags } = useTags();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
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
      setFileError(msg.includes("size") ? `File too large — max ${formatFileSize(MAX_FILE_SIZE)}` : msg);
      return;
    }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((t) => [...t, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setSelectedTags((t) => t.filter((x) => x !== tag));

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error("Please select a file"); return; }

    setUploading(true);
    setProgress(0);
    abortRef.current = new AbortController();

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title_en",    data.title_en);
    fd.append("title_bn",    data.title_bn    || "");
    fd.append("description", data.description || "");
    fd.append("category",    data.category);
    fd.append("language",    data.language);
    fd.append("access_tier", data.access_tier);
    fd.append("status",      data.status);
    fd.append("authors",     JSON.stringify(
      data.authors ? data.authors.split(",").map((a) => a.trim()).filter(Boolean) : []
    ));
    if (selectedTags.length > 0) {
      fd.append("tags", JSON.stringify(selectedTags));
    }

    const metaObj: Record<string, string> = {};
    customFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        metaObj[f.key.trim()] = f.value.trim();
      }
    });
    fd.append("custom_metadata", JSON.stringify(metaObj));

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 85));
    }, 300);

    try {
      await upload(fd);
      clearInterval(progressInterval);
      setProgress(100);
      toast.success("Document uploaded successfully!");
      setTimeout(() => {
        reset();
        setFile(null);
        setSelectedTags([]);
        setProgress(0);
        setUploading(false);
        onClose();
      }, 600);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setProgress(0);
      setUploading(false);

      const metadata: Record<string, string> = {
        title_en:    data.title_en,
        title_bn:    data.title_bn    || "",
        description: data.description || "",
        category:    data.category,
        language:    data.language,
        access_tier: data.access_tier,
        status:      data.status,
        authors:     data.authors || "",
        tags:        selectedTags.join(","),
      };

      addToQueue({ fileName: file.name, fileSize: file.size, metadata });

      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes("bucket") || msg?.includes("S3") || msg?.includes("network")) {
        toast("Upload queued — will retry when connection is restored", { icon: "⏳" });
      } else {
        toast.error(msg || "Upload failed. Please try again.");
      }
    }
  };

  const handleClose = () => {
    if (uploading) {
      abortRef.current?.abort();
      setUploading(false);
    }
    reset();
    setFile(null);
    setSelectedTags([]);
    setProgress(0);
    setFileError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Archive Document"
      description="Add historic documents, maps, institutional papers or research data to the repository"
      size="xl"
      persistent={uploading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ maxHeight: "70vh" }}>
        
        {/* Scrollable Form Fields */}
        <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 pb-12" style={{ maxHeight: "calc(70vh - 70px)" }}>

          {/* ── Dropzone ─────────────────────────────────── */}
          <div
            {...getRootProps()}
            style={{
              border: isDragActive
                ? "2px dashed var(--avatar-theme-color, #3b82f6)"
                : file
                ? "2px dashed #10b981"
                : "2px dashed #cbd5e1",
              background: isDragActive
                ? "rgba(59, 130, 246, 0.05)"
                : file
                ? "rgba(16, 185, 129, 0.05)"
                : "#f8fafc",
              borderRadius: "14px",
              padding: "24px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              boxShadow: isDragActive ? "0 0 12px rgba(59, 130, 246, 0.15)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!file && !isDragActive) {
                e.currentTarget.style.borderColor = "var(--avatar-theme-color, #3b82f6)";
                e.currentTarget.style.background = "#f1f5f9";
              }
            }}
            onMouseLeave={(e) => {
              if (!file && !isDragActive) {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.background = "#f8fafc";
              }
            }}
          >
            <input {...getInputProps()} aria-label="Upload file" />
            {file ? (
              <div className="flex items-center gap-3.5 p-1">
                <FileIcon mime={file.type} size={28} />
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
              <div className="py-1">
                <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  {isDragActive ? "Drop file here to upload" : "Drag & drop your file or click to browse"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports PDF, DOCX, PPTX, Images, MP3, MP4 — Max 500 MB
                </p>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-xs text-red-500 flex items-center gap-1 -mt-4 font-semibold">
              <AlertCircle size={13} /> {fileError}
            </p>
          )}

          {/* ── Upload progress ───────────────────────────── */}
          {uploading && (
            <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Uploading to institutional storage…
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, #3b82f6 100%)",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Bilingual titles ──────────────────────────── */}
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

          {/* ── Authors ───────────────────────────────────── */}
          <Input
            label="Authors / Contributors"
            placeholder="Author 1, Author 2, ..."
            hint="Separated by comma"
            {...register("authors")}
          />

          {/* ── Description ───────────────────────────────── */}
          <Textarea
            label="Description / Summary"
            rows={3}
            placeholder="Provide a detailed description, summary or historical context of the archive document…"
            {...register("description")}
          />

          {/* ── Category / Language / Access ──────────────── */}
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

          {/* ── Status workflow ───────────────────────────── */}
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

          {/* ── Tags ──────────────────────────────────────── */}
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

          {/* ── Custom Metadata Fields ────────────────────── */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Plus size={13} /> Custom Metadata Parameters
            </label>
            
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

        </div>

        {/* ── Actions (Sticky Footer) ───────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200/80 flex-shrink-0" style={{ background: "transparent" }}>
          <Button type="button" variant="invisible" onClick={handleClose} disabled={uploading}>
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
    </Modal>
  );
}
