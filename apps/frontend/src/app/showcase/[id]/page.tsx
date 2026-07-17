"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, AlertTriangle, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { DiscussionSection } from "@/components/community/DiscussionSection";

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
      <div className="mt-4 flex items-center justify-center h-64 rounded-lg border" style={{ borderColor: "var(--color-border-default)", background: "var(--color-canvas-subtle)" }}>
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border-default)" }}>
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
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading project...</div>;
  }

  if (!project) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Project not found.</div>;
  }

  const isOwnerOrAdmin = user && (project.submitted_by === user.user_id || user.role === "admin");
  const isEditable = project.status === "pending_review" || project.status === "changes_requested";
  const canReviewProject = user && (user.role === "admin" || (user.role === "researcher" && user.user_id === project.advisor_id));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {project.status === "changes_requested" && project.advisor_comments && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Revision Required</h4>
            <p className="text-sm mt-1">{project.advisor_comments}</p>
          </div>
        </div>
      )}

      <div className="gh-box p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-fg-default)" }}>{project.title}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-fg-muted)" }}>{project.department} · {project.semester}</p>
          </div>
          {isOwnerOrAdmin && isEditable && (
            <Link
              href={`/showcase/${project.project_id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-all shadow-sm shrink-0 self-start hover:opacity-90"
              style={{
                background: "var(--theme-gradient-160, linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e), #3b82f6))",
              }}
            >
              <Pencil size={13} />
              Edit Submission
            </Link>
          )}
        </div>

        <p className="text-sm mt-4" style={{ color: "var(--color-fg-default)" }}>{project.abstract}</p>

        <div className="mt-4 text-sm space-y-1" style={{ color: "var(--color-fg-default)" }}>
          <p><span className="font-medium">Advisor:</span> {project.advisor_name}</p>
          {project.submitted_by_name && <p><span className="font-medium">Submitted by:</span> {project.submitted_by_name}</p>}
          {project.status && <p><span className="font-medium">Status:</span> {project.status}</p>}
        </div>

        {!!project.team_members?.length && (
          <div className="mt-4">
            <p className="font-medium text-sm mb-1" style={{ color: "var(--color-fg-default)" }}>Team Members</p>
            <ul className="list-disc list-inside text-sm" style={{ color: "var(--color-fg-muted)" }}>
              {project.team_members.map((member: { name: string }, index: number) => (
                <li key={`${member.name}-${index}`}>{member.name}</li>
              ))}
            </ul>
          </div>
        )}

        {!!project.technologies?.length && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.technologies.map((technology: string) => (
              <span
                key={technology}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "var(--color-canvas-subtle)", color: "var(--color-fg-muted)" }}
              >
                {technology}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 text-sm">
          {isAuthenticated && project.source_code_url && (
            <a href={project.source_code_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-fg)] hover:underline">
              Source Code
            </a>
          )}
          {isAuthenticated && project.report_url && (
            <DownloadReportButton projectId={projectId} />
          )}
          {!isAuthenticated && (project.source_code_url || project.report_url) && (
            <span className="text-xs text-slate-400 italic">
              Please <Link href={`/login?redirect=/showcase/${projectId}`} className="text-primary hover:underline font-semibold">sign in</Link> to view source code or report.
            </span>
          )}
          {canReviewProject && (project.status === "pending_review" || project.status === "changes_requested") && (
            <Link href={`/showcase/review/${project.project_id}`} className="text-[var(--color-accent-fg)] hover:underline">
              Review Page
            </Link>
          )}
        </div>

        {isAuthenticated && project.video_url && (
          <div>
            <p className="font-medium text-sm mt-5 mb-1" style={{ color: "var(--color-fg-default)" }}>Demo Video</p>
            <VideoPlayer projectId={projectId} />
          </div>
        )}

        {isAuthenticated && project.report_url && (
          <div>
            <p className="font-medium text-sm mt-5 mb-1" style={{ color: "var(--color-fg-default)" }}>Project Report</p>
            <ReportViewer projectId={projectId} />
          </div>
        )}

        <DiscussionSection entityType="project" entityId={project.project_id} />
      </div>
    </div>
  );
}
