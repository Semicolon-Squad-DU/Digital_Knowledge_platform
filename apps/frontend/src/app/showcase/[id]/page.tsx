"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
        <p className="text-sm text-slate-600 mt-1">{project.department} · {project.semester}</p>

        <p className="text-sm text-slate-700 mt-4">{project.abstract}</p>

        <div className="mt-4 text-sm text-slate-700 space-y-1">
          <p><span className="font-medium text-slate-800">Advisor:</span> {project.advisor_name}</p>
          {project.submitted_by_name && <p><span className="font-medium text-slate-800">Submitted by:</span> {project.submitted_by_name}</p>}
          {project.status && <p><span className="font-medium text-slate-800">Status:</span> {project.status}</p>}
        </div>

        {!!project.team_members?.length && (
          <div className="mt-4">
            <p className="font-medium text-slate-800 text-sm mb-1">Team Members</p>
            <ul className="list-disc list-inside text-sm text-slate-700">
              {project.team_members.map((member: { name: string }, index: number) => (
                <li key={`${member.name}-${index}`}>{member.name}</li>
              ))}
            </ul>
          </div>
        )}

        {!!project.technologies?.length && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.technologies.map((technology: string) => (
              <span key={technology} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                {technology}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 text-sm">
          {project.source_code_url && (
            <a href={project.source_code_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Source Code
            </a>
          )}
          {project.report_url && (
            <a href={project.report_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Report
            </a>
          )}
          {(project.status === "pending_review" || project.status === "changes_requested") && (
            <Link href={`/showcase/review/${project.project_id}`} className="text-primary-600 hover:underline">
              Review Page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
