"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Plus, Trash2, Upload, FileText, X, GraduationCap, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useSubmitProject } from "@/hooks/useShowcase";
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

  // Submit
  const onSubmit = async (values: FormValues) => {
    // Resolve advisor_name to advisor_id
    const typedName = values.advisor_name.trim().toLowerCase();
    const matched = advisorData?.find(
      (a) => a.name.toLowerCase().includes(typedName) || typedName.includes(a.name.toLowerCase())
    );
    const resolvedAdvisorId = matched ? matched.user_id : (advisorData?.[0]?.user_id ?? "");

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
      <AppLayout>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <GraduationCap size={40} style={{ margin: "0 auto 16px", color: "#6b7280" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>Access Restricted</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            Only student authors can submit projects.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Back Button & Breadcrumb Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button
            onClick={() => router.back()}
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "var(--avatar-theme-color, #d1d5db)";
              e.currentTarget.style.color = "var(--avatar-theme-color, #111827)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#374151";
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/showcase")}>Showcase</span>
            <span>/</span>
            <span style={{ color: "#111827", fontWeight: 500 }}>Submit</span>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 40,
            fontWeight: 800,
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, color-mix(in srgb, var(--avatar-theme-color) 40%, #fff) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
            lineHeight: 1.2,
            display: "inline-block"
          }}>
            Submit Project
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            Submit your project for advisor review and showcase publication
          </p>
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
                  padding: "6px 14px",
                  background: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 70%, #fff) 100%)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.filter = "brightness(1.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
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
                  <input {...getInputProps()} aria-label="Upload PDF report" />
                  <Upload
                    size={24}
                    color={isDragActive ? "var(--avatar-theme-color, #2563eb)" : "#6b7280"}
                    style={{ margin: "0 auto 12px" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", margin: 0 }}>
                    {isDragActive ? "Drop your PDF here" : "Drag & drop your report PDF"}
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
              disabled={isSubmitting || submitProject.isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "var(--avatar-theme-color, var(--theme-gradient-160))",
                border: "none",
                borderRadius: 8,
                cursor: (isSubmitting || submitProject.isPending) ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                opacity: (isSubmitting || submitProject.isPending) ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (!isSubmitting && !submitProject.isPending) {
                  e.currentTarget.style.filter = "brightness(1.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting && !submitProject.isPending) {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              <GraduationCap size={15} />
              {isSubmitting || submitProject.isPending ? "Submitting..." : "Submit for Review"}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}
