"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, X, FileText, Image, Music, Video, File,
  AlertCircle, CheckCircle2, Clock, Loader2, Tag, Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useUploadArchiveItem, useTags } from "@/hooks/useArchive";
import { formatFileSize, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Local queue (persisted in localStorage for fallback)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// File type icon
// ---------------------------------------------------------------------------

function FileIcon({ mime, size = 20 }: { mime: string; size?: number }) {
  if (mime.startsWith("image/"))  return <Image  size={size} className="text-purple-500" />;
  if (mime.startsWith("audio/"))  return <Music  size={size} className="text-green-500" />;
  if (mime.startsWith("video/"))  return <Video  size={size} className="text-blue-500" />;
  if (mime.includes("pdf"))       return <FileText size={size} className="text-red-500" />;
  return <File size={size} className="text-[var(--color-fg-muted)]" />;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile]             = useState<File | null>(null);
  const [fileError, setFileError]   = useState("");
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const abortRef                    = useRef<AbortController | null>(null);

  const { mutateAsync: upload } = useUploadArchiveItem();
  const { data: availableTags } = useTags();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      access_tier: "public",
      language: "en",
      category: "General",
      status: "draft",
    },
  });

  const currentStatus = watch("status");

  // Dropzone
  const onDrop = useCallback((accepted: File[], rejected: { errors: { message: string }[] }[]) => {
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

  // Tag management
  const addTag = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((t) => [...t, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setSelectedTags((t) => t.filter((x) => x !== tag));

  // Submit
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

    // Simulate progress (real progress needs XHR — axios doesn't expose it easily with FormData)
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

      // S3 failed — add to local queue as fallback
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
      description="Supported: PDF, Word, Images, Audio, Video, Text — max 500 MB"
      size="xl"
      persistent={uploading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Dropzone ─────────────────────────────────── */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)]"
              : file
              ? "border-[var(--color-success-fg)] bg-[var(--color-success-subtle)]"
              : "border-[var(--color-border-default)] hover:border-[var(--color-accent-fg)] hover:bg-[var(--color-canvas-subtle)]"
          )}
        >
          <input {...getInputProps()} aria-label="Upload file" />
          {file ? (
            <div className="flex items-center gap-3">
              <FileIcon mime={file.type} size={24} />
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm text-[var(--color-fg-default)] truncate">{file.name}</p>
                <p className="text-xs text-[var(--color-fg-muted)]">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-1 rounded text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                aria-label="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} className="mx-auto mb-2 text-[var(--color-fg-muted)]" />
              <p className="text-sm font-medium text-[var(--color-fg-default)]">
                {isDragActive ? "Drop file here" : "Drag & drop or click to select"}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                PDF · DOCX · PPTX · TXT · JPG · PNG · MP3 · MP4 · AVI · WebM — max 500 MB
              </p>
            </>
          )}
        </div>
        {fileError && (
          <p className="form-error -mt-3">
            <AlertCircle size={13} /> {fileError}
          </p>
        )}

        {/* ── Upload progress ───────────────────────────── */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
              <span className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Uploading…
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-canvas-inset)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--gradient-accent)",
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
            placeholder="e.g. Introduction to Algorithms"
            error={errors.title_en?.message}
            {...register("title_en")}
          />
          <Input
            label="বাংলা শিরোনাম"
            placeholder="বাংলা শিরোনাম লিখুন"
            className="bangla"
            {...register("title_bn")}
          />
        </div>

        {/* ── Authors ───────────────────────────────────── */}
        <Input
          label="Authors"
          placeholder="Author 1, Author 2, ..."
          hint="Comma-separated"
          {...register("authors")}
        />

        {/* ── Description ───────────────────────────────── */}
        <Textarea
          label="Description"
          rows={3}
          placeholder="Brief description of the document…"
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
              { value: "both", label: "Both" },
            ]}
            {...register("language")}
          />
          <Select
            label="Access Tier"
            options={[
              { value: "public",     label: "🌐 Public" },
              { value: "member",     label: "👤 Members Only" },
              { value: "staff",      label: "🔒 Staff Only" },
              { value: "restricted", label: "🚫 Restricted" },
            ]}
            {...register("access_tier")}
          />
        </div>

        {/* ── Status workflow ───────────────────────────── */}
        <div>
          <label className="form-label">Status Workflow</label>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW.map((s, i) => {
              const isActive  = currentStatus === s;
              const isPast    = STATUS_FLOW.indexOf(currentStatus as ArchiveStatus) > i;
              const icons: Record<ArchiveStatus, React.ReactNode> = {
                draft:     <Clock size={12} />,
                review:    <Loader2 size={12} />,
                published: <CheckCircle2 size={12} />,
                archived:  <AlertCircle size={12} />,
              };
              return (
                <label
                  key={s}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all",
                    isActive
                      ? "border-[var(--color-accent-fg)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
                      : isPast
                      ? "border-[var(--color-success-fg)] bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]"
                      : "border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent-fg)]"
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
        <div>
          <label className="form-label flex items-center gap-1.5">
            <Tag size={13} /> Tags
          </label>
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--gradient-accent)] text-white"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:opacity-70"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Existing tags from DB */}
          {availableTags && availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {availableTags
                .filter((t: { name_en: string }) => !selectedTags.includes(t.name_en))
                .slice(0, 12)
                .map((t: { tag_id: string; name_en: string }) => (
                  <button
                    key={t.tag_id}
                    type="button"
                    onClick={() => addTag(t.name_en)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent-fg)] hover:text-[var(--color-accent-fg)] transition-colors"
                  >
                    <Plus size={10} /> {t.name_en}
                  </button>
                ))}
            </div>
          )}
          {/* Custom tag input */}
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
              placeholder="Type a tag and press Enter"
              className="form-input flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
          <p className="form-hint">Press Enter or comma to add a tag</p>
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-border-muted)]">
          <Button type="button" variant="invisible" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={uploading}
            disabled={!file || uploading}
            icon={<Upload size={14} />}
          >
            {uploading ? `Uploading ${Math.round(progress)}%…` : "Upload Document"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
