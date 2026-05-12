"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUploadArchiveItem } from "@/features/archive/hooks/useArchive";
import { formatFileSize } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "audio/mpeg": [".mp3"],
  "video/mp4": [".mp4"],
};

const schema = z.object({
  title_en: z.string().min(1, "English title is required"),
  title_bn: z.string().optional(),
  description: z.string().optional(),
  authors: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  language: z.string().default("en"),
  access_tier: z.enum(["public", "member", "staff", "restricted"]),
});

type FormData = z.infer<typeof schema>;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync: upload, isPending } = useUploadArchiveItem();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { access_tier: "public", language: "en", category: "General" },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error("Please select a file"); return; }

    const formData = new FormData();
    formData.append("file", file);
    Object.entries(data).forEach(([k, v]) => {
      if (v) formData.append(k, k === "authors" ? JSON.stringify(v.split(",").map((a) => a.trim())) : v);
    });

    try {
      await upload(formData);
      toast.success("File uploaded successfully");
      reset();
      setFile(null);
      onClose();
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Archive Document" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="text-primary-600" size={24} />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-auto p-1 rounded text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600">
                {isDragActive ? "Drop file here" : "Drag & drop or click to select"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, TXT, Images, Audio, Video — max 500 MB</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="English Title"
            required
            {...register("title_en")}
            error={errors.title_en?.message}
          />
          <Input
            label="Bangla Title (optional)"
            {...register("title_bn")}
            placeholder="বাংলা শিরোনাম"
          />
        </div>

        <Input
          label="Authors"
          {...register("authors")}
          placeholder="Author 1, Author 2, ..."
          hint="Comma-separated list"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Category" required {...register("category")} error={errors.category?.message} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select
              {...register("language")}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">English</option>
              <option value="bn">Bangla</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Access Tier <span className="text-red-500">*</span></label>
            <select
              {...register("access_tier")}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="public">Public</option>
              <option value="member">Members Only</option>
              <option value="staff">Staff Only</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Brief description of the document..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending}>
            <Upload size={16} /> Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
