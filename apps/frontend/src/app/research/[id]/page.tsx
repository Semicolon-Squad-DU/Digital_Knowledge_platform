"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Copy, Check, Download } from "lucide-react";
import toast from "react-hot-toast";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function downloadBib(bibtex: string, identifier: string) {
  const blob = new Blob([bibtex], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${identifier}.bib`;
  a.click();
  URL.revokeObjectURL(url);
}

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
          <div className="space-y-4 text-sm">
            {/* APA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-slate-800">APA</p>
                <CopyButton text={citation.apa} />
              </div>
              <p className="text-slate-700">{citation.apa}</p>
            </div>

            {/* MLA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-slate-800">MLA</p>
                <CopyButton text={citation.mla} />
              </div>
              <p className="text-slate-700">{citation.mla}</p>
            </div>

            {/* BibTeX */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-slate-800">BibTeX</p>
                <div className="flex items-center gap-3">
                  <CopyButton text={citation.bibtex} />
                  <button
                    onClick={() => downloadBib(citation.bibtex, output.dkp_identifier)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 transition-colors"
                    title="Download .bib file"
                  >
                    <Download size={13} /> Download .bib
                  </button>
                </div>
              </div>
              <pre className="text-xs text-slate-700 bg-slate-50 rounded p-3 overflow-x-auto">{citation.bibtex}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

