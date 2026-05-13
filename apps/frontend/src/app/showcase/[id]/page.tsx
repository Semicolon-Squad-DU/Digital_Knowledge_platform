"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

function DownloadReportButton({ reportKey }: { reportKey: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/archive/download-url", {
        params: { key: reportKey },
      });
      window.open(data.data.url, "_blank");
    } catch {
      // Fallback: try direct MinIO URL
      const minioUrl = `http://localhost:9000/dkp-files/${reportKey}`;
      window.open(minioUrl, "_blank");
      toast("Opening report via direct link");
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="gh-box p-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-fg-default)" }}>{project.title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-fg-muted)" }}>{project.department} · {project.semester}</p>

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
            <DownloadReportButton reportKey={project.report_url} />
          )}
          {(project.status === "pending_review" || project.status === "changes_requested") && (
            <Link href={`/showcase/review/${project.project_id}`} className="text-[var(--color-accent-fg)] hover:underline">
              Review Page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
