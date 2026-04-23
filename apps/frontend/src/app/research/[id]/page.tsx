"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const outputId = params?.id ?? "";

  const { data: output, isLoading } = useQuery({
    queryKey: ["research", "detail", outputId],
    queryFn: async () => {
      const { data } = await api.get(`/research/${outputId}`);
      return data.data;
    },
    enabled: !!outputId,
  });

  const { data: citation } = useQuery({
    queryKey: ["research", "cite", outputId],
    queryFn: async () => {
      const { data } = await api.get(`/research/${outputId}/cite`);
      return data.data;
    },
    enabled: !!outputId,
  });

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading research output...</div>;
  }

  if (!output) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Research output not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{output.title}</h1>
        <p className="text-sm text-slate-600 mt-1">{output.authors?.map((a: { name: string }) => a.name).join(", ")}</p>

        {output.abstract && <p className="text-sm text-slate-700 mt-4">{output.abstract}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          {output.keywords?.map((keyword: string) => (
            <span key={keyword} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
              {keyword}
            </span>
          ))}
        </div>

        <div className="text-sm text-slate-600 mt-4 space-y-1">
          <p><span className="font-medium text-slate-800">Type:</span> {output.output_type?.replaceAll("_", " ")}</p>
          <p><span className="font-medium text-slate-800">Identifier:</span> {output.dkp_identifier}</p>
          {output.journal_name && <p><span className="font-medium text-slate-800">Journal:</span> {output.journal_name}</p>}
          {output.lab_name && <p><span className="font-medium text-slate-800">Lab:</span> {output.lab_name}</p>}
          {output.doi && (
            <p>
              <span className="font-medium text-slate-800">DOI:</span>{" "}
              <a href={`https://doi.org/${output.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                {output.doi}
              </a>
            </p>
          )}
        </div>

        {output.file_url && (
          <div className="mt-4">
            <a href={output.file_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Open Attached File</Button>
            </a>
          </div>
        )}
      </div>

      {citation && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Citations</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-800 mb-1">APA</p>
              <p className="text-slate-700">{citation.apa}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">MLA</p>
              <p className="text-slate-700">{citation.mla}</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">BibTeX</p>
              <pre className="text-xs text-slate-700 bg-slate-50 rounded p-3 overflow-x-auto">{citation.bibtex}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
