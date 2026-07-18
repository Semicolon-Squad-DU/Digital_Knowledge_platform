"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, AlertTriangle, Pencil, GraduationCap, Code2, Video, Tag } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { DiscussionSection } from "@/components/community/DiscussionSection";
import { AppLayout } from "@/components/layout/AppLayout";

function DownloadReportButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/showcase/${projectId}/download-url`);
      window.open(data.data.url, "_blank");
    } catch {
      toast.error("Could not open report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-[var(--color-accent-fg)] hover:underline text-sm disabled:opacity-60"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
      View Report
    </button>
  );
}

// Embedded PDF report viewer — fetches a fresh presigned URL and renders it inline
// via <iframe> instead of only offering a download link.
function ReportViewer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/showcase/${projectId}/download-url`)
      .then(({ data }) => { if (!cancelled) setUrl(data.data.url); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (error) return null;
  if (!url) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border" style={{ borderColor: "var(--color-border-default)", background: "var(--color-canvas-subtle)" }}>
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border-default)" }}>
      <iframe src={url} title="Project report" className="w-full" style={{ height: 500, border: "none" }} />
    </div>
  );
}

// Embedded demo video player — fetches a fresh presigned URL for the uploaded video.
function VideoPlayer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/showcase/${projectId}/video-url`)
      .then(({ data }) => { if (!cancelled) setUrl(data.data.url); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (error) return null;
  if (!url) {
    return (
      <div className="mt-4 flex items-center justify-center h-64 rounded-lg border" style={{ borderColor: "var(--color-border-default)", background: "var(--color-canvas-subtle)" }}>
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border-default)" }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video src={url} controls className="w-full" style={{ maxHeight: 500, display: "block", background: "#000" }} />
    </div>
  );
}

export default function ShowcaseDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const { user, isAuthenticated } = useAuthStore();

  const { data: project, isLoading } = useQuery({
    queryKey: ["showcase", "detail", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/showcase/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading project...</div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Project not found.</div>
      </AppLayout>
    );
  }

  const isOwnerOrAdmin = user && (project.submitted_by === user.user_id || user.role === "admin");
  const isEditable = project.status === "pending_review" || project.status === "changes_requested";
  const canReviewProject = user && (user.role === "admin" || (user.role === "researcher" && user.user_id === project.advisor_id));

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    published:          { bg: "#e6f4ea", color: "#1e7e34" },
    pending_review:     { bg: "#fef3c7", color: "#92400e" },
    changes_requested:  { bg: "#fee2e2", color: "#b91c1c" },
    approved:           { bg: "#e6f4ea", color: "#1e7e34" },
    rejected:           { bg: "#fee2e2", color: "#b91c1c" },
  };
  const statusStyle = STATUS_STYLES[project.status] ?? { bg: "#f3f4f6", color: "#6b7280" };

  return (
    <AppLayout>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: "36px 40px 34px",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <GraduationCap size={19} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
                    {project.title}
                  </h1>
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                    {project.department} · {project.semester}
                  </p>
                </div>
              </div>
              {isOwnerOrAdmin && isEditable && (
                <Link
                  href={`/showcase/${project.project_id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white transition-all shadow-sm shrink-0 self-start hover:opacity-90"
                  style={{
                    background: "var(--theme-gradient-160, linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e), #3b82f6))",
                  }}
                >
                  <Pencil size={13} />
                  Edit Submission
                </Link>
              )}
            </div>
          </div>
        </div>

      <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto" }}>

      {project.status === "changes_requested" && project.advisor_comments && (
        <div className="mb-5 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Revision Required</h4>
            <p className="text-sm mt-1">{project.advisor_comments}</p>
          </div>
        </div>
      )}

      {/* ── Overview card ─────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 20,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Project Overview</h2>
          {project.status && (
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              background: statusStyle.bg, color: statusStyle.color,
            }}>
              {project.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div style={{ padding: 20 }} className="space-y-4">
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>{project.abstract}</p>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px 24px", fontSize: 13, borderTop: "1px solid #f3f4f6", paddingTop: 16,
          }}>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Advisor</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>{project.advisor_name}</p>
            </div>
            {project.submitted_by_name && (
              <div>
                <span style={{ color: "#9ca3af", fontWeight: 500 }}>Submitted by</span>
                <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>{project.submitted_by_name}</p>
              </div>
            )}
          </div>

          {!!project.team_members?.length && (
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Team Members</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {project.team_members.map((member: { name: string }, index: number) => (
                  <span
                    key={`${member.name}-${index}`}
                    style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#f3f4f6", color: "#374151" }}
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!project.technologies?.length && (
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <Tag size={13} color="#9ca3af" /> Technologies
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {project.technologies.map((technology: string) => (
                  <span
                    key={technology}
                    style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: "#eff6ff", color: "#1a56db" }}
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {isAuthenticated && project.source_code_url && (
              <a href={project.source_code_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1a56db", textDecoration: "none" }}>
                <Code2 size={14} /> Source Code
              </a>
            )}
            {isAuthenticated && project.report_url && (
              <DownloadReportButton projectId={projectId} />
            )}
            {!isAuthenticated && (project.source_code_url || project.report_url) && (
              <span style={{ fontSize: 12.5, color: "#9ca3af", fontStyle: "italic" }}>
                Please <Link href={`/login?redirect=/showcase/${projectId}`} style={{ color: "var(--avatar-theme-color, #1a1a2e)", fontWeight: 700, textDecoration: "none" }}>sign in</Link> to view source code or report.
              </span>
            )}
            {canReviewProject && (project.status === "pending_review" || project.status === "changes_requested") && (
              <Link href={`/showcase/review/${project.project_id}`} style={{ fontSize: 13, fontWeight: 600, color: "#1a56db", textDecoration: "none" }}>
                Review Page
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Demo Video ─────────────────────────────────── */}
      {isAuthenticated && project.video_url && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 20,
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Video size={15} color="var(--avatar-theme-color, #2563eb)" /> Demo Video
            </h2>
          </div>
          <div style={{ padding: 20 }}>
            <VideoPlayer projectId={projectId} />
          </div>
        </div>
      )}

      {/* ── Project Report ─────────────────────────────── */}
      {isAuthenticated && project.report_url && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 20,
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={15} color="var(--avatar-theme-color, #2563eb)" /> Project Report
            </h2>
          </div>
          <div style={{ padding: 20 }}>
            <ReportViewer projectId={projectId} />
          </div>
        </div>
      )}

      <DiscussionSection entityType="project" entityId={project.project_id} />
      </div>
      </div>
    </AppLayout>
  );
}
