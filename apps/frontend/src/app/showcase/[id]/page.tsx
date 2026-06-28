"use client";

import { useState } from "react";
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

export default function ShowcaseDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const { user } = useAuthStore();

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
          {project.source_code_url && (
            <a href={project.source_code_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-fg)] hover:underline">
              Source Code
            </a>
          )}
          {project.report_url && (
            <DownloadReportButton projectId={projectId} />
          )}
          {(project.status === "pending_review" || project.status === "changes_requested") && (
            <Link href={`/showcase/review/${project.project_id}`} className="text-[var(--color-accent-fg)] hover:underline">
              Review Page
            </Link>
          )}
        </div>
        
        <DiscussionSection entityType="project" entityId={project.project_id} />
      </div>
    </div>
  );
}
