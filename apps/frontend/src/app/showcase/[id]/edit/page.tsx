"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Plus, Trash2, Upload, FileText, X, GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Textarea } from "@/components/ui/Input";
import { useShowcaseItem, useUpdateProject } from "@/features/showcase/hooks/useShowcase";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatFileSize } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";

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
  advisor_name:   z.string().min(1, "Advisor is required"),
  semester:       z.string().min(1, "Semester is required"),
  department:     z.string().min(1, "Department is required"),
  technologies:   z.string().optional(),
  source_code_url:z.string().url("Must be a valid URL").optional().or(z.literal("")),
  team_members:   z.array(teamMemberSchema).min(1, "At least one team member is required"),
});

type FormValues = z.infer<typeof schema>;

const MAX_PDF_MB  = 20;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

export default function EditProjectPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const projectId = params?.id ?? "";

  const { user } = useAuthStore();
  const updateProject = useUpdateProject();

  const [pdfFile, setPdfFile]   = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string>("");
  const [existingReport, setExistingReport] = useState<string | null>(null);

  const { data: project, isLoading: loadingProject } = useShowcaseItem(projectId);

  const { data: advisorData } = useQuery({
    queryKey: ["advisors"],
    queryFn: async () => {
      const { data } = await api.get("/auth/advisors");
      return data.data as { user_id: string; name: string; department: string }[];
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      abstract: "",
      advisor_name: "",
      semester: "",
      department: "",
      technologies: "",
      source_code_url: "",
      team_members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "team_members" });

  // Populating form values when data is loaded
  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        abstract: project.abstract,
        advisor_name: project.advisor_name || "",
        semester: project.semester,
        department: project.department,
        technologies: Array.isArray(project.technologies) ? project.technologies.join(", ") : "",
        source_code_url: project.source_code_url || "",
        team_members: project.team_members || [],
      });
      if (project.report_url) {
        setExistingReport(project.report_url);
      }
    }
  }, [project, reset]);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setPdfError("");
    if (rejected.length > 0) {
      setPdfError(rejected[0].errors[0]?.message ?? "Invalid file");
      return;
    }
    if (accepted[0]) {
      setPdfFile(accepted[0]);
      setExistingReport(null); // Overwrite existing report with new upload
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_PDF_BYTES,
    multiple: false,
  });

  const onSubmit = async (values: FormValues) => {
    const typedName = values.advisor_name.trim().toLowerCase();
    const matched = advisorData?.find(
      (a) => a.name.toLowerCase().includes(typedName) || typedName.includes(a.name.toLowerCase())
    );
    const resolvedAdvisorId = matched ? matched.user_id : (project?.advisor_id ?? advisorData?.[0]?.user_id ?? "");

    const fd = new FormData();
    fd.append("title",        values.title);
    fd.append("abstract",     values.abstract);
    fd.append("advisor_id",   resolvedAdvisorId);
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
      await updateProject.mutateAsync({ id: projectId, formData: fd });
      toast.success("Project updated and submitted back for review!");
      router.push(`/showcase/${projectId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to update project. Please try again.";
      toast.error(msg);
      console.error("Update error:", err);
    }
  };

  if (loadingProject) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--avatar-theme-color)" }} />
        </div>
      </AppLayout>
    );
  }

  // Guard — only the author who submitted or admin
  const isAuthorized = user && (project?.submitted_by === user.user_id || user.role === "admin");
  if (!isAuthorized) {
    return (
      <AppLayout>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <GraduationCap size={40} style={{ margin: "0 auto 16px", color: "#6b7280" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>Access Restricted</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            You can only edit your own project submissions.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Guard - approved projects cannot be edited
  if (project?.status === "published" && user?.role !== "admin") {
    return (
      <AppLayout>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <GraduationCap size={40} style={{ margin: "0 auto 16px", color: "#6b7280" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>Editing Locked</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            This project has already been approved and published. It can no longer be edited.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
          <span>/</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/showcase")}>Showcase</span>
          <span>/</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/showcase/${projectId}`)}>Project Details</span>
          <span>/</span>
          <span style={{ color: "var(--avatar-theme-color)", fontWeight: 500 }}>Edit Submission</span>
        </div>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#6b7280", padding: 0 }}
            >
              <ArrowLeft size={16} />
            </button>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2 }}>
              Edit Project Submission
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Update your project details and re-submit for advisor approval.
          </p>
          {project?.advisor_comments && (
            <div style={{
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: 8,
              padding: "12px 16px",
              marginTop: 16,
              fontSize: 13,
              color: "#92400e",
            }}>
              <strong>Advisor Feedback:</strong> &ldquo;{project.advisor_comments}&rdquo;
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Basic Info ─────────────────────────────────── */}
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
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Project Details</h2>
            </div>
            <div style={{ padding: 20 }} className="space-y-4">
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
                <Input
                  label="Department"
                  required
                  placeholder="e.g. CSE"
                  error={errors.department?.message}
                  {...register("department")}
                />
                <Input
                  label="Semester"
                  required
                  placeholder="e.g. 4th Year 1st Semester 2026"
                  error={errors.semester?.message}
                  {...register("semester")}
                />
              </div>
              <Input
                label="Advisor"
                required
                placeholder="e.g. Dr. Rahim"
                error={errors.advisor_name?.message}
                {...register("advisor_name")}
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
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                Team Members
                <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>
                  ({fields.length})
                </span>
              </h2>
              <button
                type="button"
                onClick={() => append({ name: "", student_id: "", email: "", role: "" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
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
                <Plus size={13} /> Add Member
              </button>
            </div>
            <div style={{ padding: 20 }} className="space-y-4">
              {errors.team_members?.root && (
                <p className="form-error">{errors.team_members.root.message}</p>
              )}
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    padding: 16,
                    background: "#f9fafb",
                    marginBottom: idx === fields.length - 1 ? 0 : 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Member {idx + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        style={{
                          padding: 4,
                          borderRadius: 4,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#fee2e2")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
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
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                Project Report
                <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>(optional)</span>
              </h2>
            </div>
            <div style={{ padding: 20 }}>
              {existingReport && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f0fdf4",
                  marginBottom: 16,
                }}>
                  <FileText size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: 0 }}>
                      Active Project Report PDF Loaded
                    </p>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>
                      You can drop a new PDF below to replace this file.
                    </p>
                  </div>
                </div>
              )}
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
                  <FileText size={20} color="var(--avatar-theme-color)" style={{ flexShrink: 0 }} />
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
                    onClick={() => {
                      setPdfFile(null);
                      if (project?.report_url) setExistingReport(project.report_url);
                    }}
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
                    background: isDragActive ? "#eff6ff" : "#fff",
                    borderColor: isDragActive ? "var(--avatar-theme-color)" : "#d1d5db",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = "var(--avatar-theme-color)";
                      e.currentTarget.style.background = "#f9fafb";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDragActive) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "#fff";
                    }
                  }}
                >
                  <input {...getInputProps()} aria-label="Upload PDF report" />
                  <Upload
                    size={24}
                    color={isDragActive ? "var(--avatar-theme-color)" : "#6b7280"}
                    style={{ margin: "0 auto 12px" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", margin: 0 }}>
                    {isDragActive ? "Drop your PDF here" : "Drag & drop your report PDF"}
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginBottom: 0 }}>
                    or <span style={{ color: "var(--avatar-theme-color)", fontWeight: 500 }}>browse to upload</span> · PDF only · max {MAX_PDF_MB} MB
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
              onClick={() => router.back()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
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
              disabled={isSubmitting || updateProject.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                border: "none",
                borderRadius: 8,
                cursor: (isSubmitting || updateProject.isPending) ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                opacity: (isSubmitting || updateProject.isPending) ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!isSubmitting && !updateProject.isPending) {
                  e.currentTarget.style.filter = "brightness(1.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting && !updateProject.isPending) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              <GraduationCap size={15} />
              {isSubmitting || updateProject.isPending ? "Saving..." : "Save & Re-submit"}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
