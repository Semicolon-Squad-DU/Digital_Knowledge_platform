"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Plus, Trash2, Upload, FileText, X, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSubmitProject } from "@/hooks/useShowcase";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatFileSize } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const teamMemberSchema = z.object({
  name:       z.string().min(1, "Name is required"),
  student_id: z.string().optional(),
  email:      z.string().email("Invalid email").optional().or(z.literal("")),
  role:       z.string().optional(),
});

const schema = z.object({
  title:          z.string().min(5, "Title must be at least 5 characters"),
  abstract:       z.string().min(50, "Abstract must be at least 50 characters"),
  advisor_id:     z.string().min(1, "Advisor is required"),
  semester:       z.string().min(1, "Semester is required"),
  department:     z.string().min(1, "Department is required"),
  technologies:   z.string().optional(),
  source_code_url:z.string().url("Must be a valid URL").optional().or(z.literal("")),
  team_members:   z.array(teamMemberSchema).min(1, "At least one team member is required"),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEPARTMENTS = ["CSE", "EEE", "ME", "CE", "BBA", "English", "Physics", "Mathematics", "Chemistry"];
const SEMESTERS   = [
  "4th Year 1st Semester 2026",
  "3rd Year 2nd Semester 2026",
  "2nd Year 2nd Semester 2026",
  "1st Year 2nd Semester 2026",
];
const MAX_PDF_MB  = 20;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubmitProjectPage() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const submitProject = useSubmitProject();

  const [pdfFile, setPdfFile]   = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string>("");

  const { data: advisorData } = useQuery({
    queryKey: ["advisors"],
    queryFn: async () => {
      const { data } = await api.get("/auth/advisors");
      return data.data as { user_id: string; name: string; department: string }[];
    },
  });
  const advisors: { value: string; label: string }[] =
    (advisorData ?? []).map((u) => ({
      value: u.user_id,
      label: u.department ? `${u.name} (${u.department})` : u.name,
    }));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      team_members: [{ name: user?.name ?? "", student_id: "", email: user?.email ?? "", role: "Lead" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "team_members" });

  // PDF dropzone
  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
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

  // Submit
  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("title",        values.title);
    fd.append("abstract",     values.abstract);
    fd.append("advisor_id",   values.advisor_id);
    fd.append("semester",     values.semester);
    fd.append("department",   values.department);
    fd.append("team_members", JSON.stringify(values.team_members));
    fd.append("technologies", JSON.stringify(
      values.technologies
        ? values.technologies.split(",").map((t) => t.trim()).filter(Boolean)
        : []
    ));
    if (values.source_code_url) fd.append("source_code_url", values.source_code_url);
    if (pdfFile) fd.append("file", pdfFile);

    try {
      const project = await submitProject.mutateAsync(fd);
      toast.success("Project submitted for advisor review!");
      router.push(`/showcase/${(project as { project_id: string }).project_id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Submission failed. Please try again.";
      toast.error(msg);
      console.error("Submission error:", err);
    }
  };

  // Guard — only student_author or admin
  if (user && user.role !== "student_author" && user.role !== "admin") {
    return (
      <div className="page-container py-16 text-center">
        <GraduationCap size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
        <p className="text-[var(--color-fg-default)] font-semibold text-lg">Access Restricted</p>
        <p className="text-[var(--color-fg-muted)] text-sm mt-1">
          Only student authors can submit projects.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-3xl">
      <PageHeader
        title="Submit Project"
        subtitle="Submit your project for advisor review and showcase publication"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Showcase", href: "/showcase" },
          { label: "Submit" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Basic Info ─────────────────────────────────── */}
        <section className="gh-box">
          <div className="gh-box-header">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">Project Details</h2>
          </div>
          <div className="gh-box-body space-y-4">
            <Input
              label="Project Title"
              required
              placeholder="e.g. Smart Campus Navigation System"
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="Abstract"
              required
              rows={5}
              placeholder="Describe your project, its objectives, methodology, and outcomes…"
              hint="Minimum 50 characters"
              error={errors.abstract?.message}
              {...register("abstract")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Department"
                required
                placeholder="Select department"
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                error={errors.department?.message}
                {...register("department")}
              />
              <Select
                label="Semester"
                required
                placeholder="Select semester"
                options={SEMESTERS.map((s) => ({ value: s, label: s }))}
                error={errors.semester?.message}
                {...register("semester")}
              />
            </div>
            <Select
              label="Advisor"
              required
              placeholder={advisors.length ? "Select advisor" : "Loading advisors…"}
              options={advisors}
              error={errors.advisor_id?.message}
              {...register("advisor_id")}
            />
            <Input
              label="Technologies Used"
              placeholder="React, Node.js, Python, Arduino (comma-separated)"
              hint="Separate each technology with a comma"
              {...register("technologies")}
            />
            <Input
              label="Source Code URL"
              type="url"
              placeholder="https://github.com/your-repo"
              error={errors.source_code_url?.message}
              {...register("source_code_url")}
            />
          </div>
        </section>

        {/* ── Team Members ───────────────────────────────── */}
        <section className="gh-box">
          <div className="gh-box-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              Team Members
              <span className="ml-2 text-xs font-normal text-[var(--color-fg-muted)]">
                ({fields.length})
              </span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => append({ name: "", student_id: "", email: "", role: "" })}
            >
              Add Member
            </Button>
          </div>
          <div className="gh-box-body space-y-4">
            {errors.team_members?.root && (
              <p className="form-error">{errors.team_members.root.message}</p>
            )}
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="relative rounded-md border border-[var(--color-border-default)] p-4 bg-[var(--color-canvas-subtle)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide">
                    Member {idx + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1 rounded text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                      aria-label={`Remove member ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Rahim Uddin"
                    error={errors.team_members?.[idx]?.name?.message}
                    {...register(`team_members.${idx}.name`)}
                  />
                  <Input
                    label="Student ID"
                    placeholder="e.g. 2021-1-60-001"
                    {...register(`team_members.${idx}.student_id`)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="student@university.edu"
                    error={errors.team_members?.[idx]?.email?.message}
                    {...register(`team_members.${idx}.email`)}
                  />
                  <Input
                    label="Role"
                    placeholder="e.g. Lead, Backend, Frontend"
                    {...register(`team_members.${idx}.role`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PDF Upload ─────────────────────────────────── */}
        <section className="gh-box">
          <div className="gh-box-header">
            <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
              Project Report
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
                <input {...getInputProps()} aria-label="Upload PDF report" />
                <Upload
                  size={24}
                  className={cn(
                    "mx-auto mb-3",
                    isDragActive ? "text-[var(--color-accent-fg)]" : "text-[var(--color-fg-muted)]"
                  )}
                />
                <p className="text-sm font-medium text-[var(--color-fg-default)]">
                  {isDragActive ? "Drop your PDF here" : "Drag & drop your report PDF"}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                  or <span className="text-[var(--color-accent-fg)]">browse to upload</span>
                  {" "}· PDF only · max {MAX_PDF_MB} MB
                </p>
              </div>
            )}
            {pdfError && <p className="form-error mt-2">{pdfError}</p>}
          </div>
        </section>

        {/* ── Actions ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="invisible"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting || submitProject.isPending}
            icon={<GraduationCap size={15} />}
          >
            Submit for Review
          </Button>
        </div>

      </form>
    </div>
  );
}
