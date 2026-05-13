"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, Check, Download, FileText, ExternalLink,
  BookOpen, Tag, FlaskConical, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type CitationFormat = "apa" | "mla" | "bibtex";

// ---------------------------------------------------------------------------
// Open file button — generates presigned URL then opens PDF
// ---------------------------------------------------------------------------
function OpenFileButton({ fileKey, outputId }: { fileKey: string; outputId: string }) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/research/${outputId}/download-url`);
      window.open(data.data.url, "_blank");
    } catch {
      window.open(`http://localhost:9000/dkp-files/${fileKey}`, "_blank");
      toast("Opening via direct link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleOpen} loading={loading} icon={<ExternalLink size={13} />}>
      {loading ? "Opening…" : "Open Attached File"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// PDF Preview — inline iframe
// ---------------------------------------------------------------------------
function PdfPreview({ fileKey, outputId }: { fileKey: string; outputId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get(`/research/${outputId}/download-url`)
      .then(({ data }) => { if (!cancelled) setUrl(data.data.url); })
      .catch(() => { if (!cancelled) setUrl(`http://localhost:9000/dkp-files/${fileKey}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fileKey]);

  if (loading) return (
    <div className="h-96 rounded-xl bg-[var(--color-canvas-subtle)] border border-[var(--color-border-default)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent-fg)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[var(--color-fg-muted)]">Loading preview…</p>
      </div>
    </div>
  );

  if (!url) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border-default)]">
      <iframe
        src={`${url}#page=1&view=FitH&toolbar=0`}
        className="w-full"
        style={{ height: "520px" }}
        title="PDF Preview"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy button with transient ✓ feedback
// ---------------------------------------------------------------------------
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        copied
          ? "bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]"
          : "bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] hover:text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-subtle)]"
      )}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// .bib download button
// ---------------------------------------------------------------------------
function BibDownloadButton({ bibtex, title }: { bibtex: string; title: string }) {
  const handleDownload = () => {
    const blob = new Blob([bibtex], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.bib`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(".bib file downloaded");
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-canvas-subtle)] text-[var(--color-fg-muted)] hover:text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-subtle)] transition-all"
      aria-label="Download .bib file"
    >
      <Download size={13} />
      .bib
    </button>
  );
}

// ---------------------------------------------------------------------------
// Citation block
// ---------------------------------------------------------------------------
function CitationBlock({
  format,
  text,
  title,
  isCode = false,
}: {
  format: CitationFormat;
  text: string;
  title: string;
  isCode?: boolean;
}) {
  const labels: Record<CitationFormat, string> = { apa: "APA", mla: "MLA", bibtex: "BibTeX" };

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-canvas-subtle)] border-b border-[var(--color-border-default)]">
        <span className="text-xs font-bold text-[var(--color-fg-default)] uppercase tracking-wide">
          {labels[format]}
        </span>
        <div className="flex items-center gap-2">
          <CopyButton text={text} label={labels[format]} />
          {format === "bibtex" && <BibDownloadButton bibtex={text} title={title} />}
        </div>
      </div>
      {/* Content */}
      {isCode ? (
        <pre className="text-xs text-[var(--color-fg-default)] bg-[var(--color-canvas-inset)] p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">
          {text}
        </pre>
      ) : (
        <p className="text-sm text-[var(--color-fg-default)] p-4 leading-relaxed">
          {text}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const outputId = params?.id ?? "";
  const [activeTab, setActiveTab] = useState<CitationFormat>("apa");
  const [showPdf, setShowPdf] = useState(false);

  const { data: output, isLoading } = useQuery({
    queryKey: ["research", "detail", outputId],
    queryFn: async () => {
      const { data } = await api.get(`/research/${outputId}`);
      return data.data;
    },
    enabled: !!outputId,
  });

  const { data: citation, isLoading: citationLoading } = useQuery({
    queryKey: ["research", "cite", outputId],
    queryFn: async () => {
      const { data } = await api.get(`/research/${outputId}/cite`);
      return data.data;
    },
    enabled: !!outputId,
  });

  if (isLoading) {
    return (
      <div className="page-container py-8 max-w-4xl">
        <SkeletonCard />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="page-container py-16 text-center">
        <FileText size={36} className="mx-auto mb-3 text-[var(--color-fg-muted)]" />
        <p className="font-semibold text-[var(--color-fg-default)]">Research output not found.</p>
      </div>
    );
  }

  const tabs: { key: CitationFormat; label: string }[] = [
    { key: "apa", label: "APA" },
    { key: "mla", label: "MLA" },
    { key: "bibtex", label: "BibTeX" },
  ];

  return (
    <div className="page-container py-8 max-w-4xl">
      <PageHeader
        title={output.title}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Research", href: "/research" },
          { label: "Detail" },
        ]}
      />

      {/* ── Main info card ─────────────────────────────── */}
      <div className="gh-box mb-5">
        <div className="gh-box-body space-y-4">

          {/* Authors */}
          <div className="flex items-start gap-2">
            <BookOpen size={15} className="mt-0.5 flex-shrink-0 text-[var(--color-accent-fg)]" />
            <p className="text-sm text-[var(--color-fg-default)]">
              {output.authors?.map((a: { name: string }) => a.name).join(", ")}
            </p>
          </div>

          {/* Abstract */}
          {output.abstract && (
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed border-l-2 border-[var(--color-accent-fg)] pl-3">
              {output.abstract}
            </p>
          )}

          {/* Keywords */}
          {output.keywords?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={13} className="text-[var(--color-fg-muted)]" />
              {output.keywords.map((kw: string) => (
                <span
                  key={kw}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-done-subtle)] text-[var(--color-done-fg)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-muted)] text-sm">
            <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
              <span className="font-medium text-[var(--color-fg-default)]">Type:</span>
              <span className="capitalize">{output.output_type}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
              <span className="font-medium text-[var(--color-fg-default)]">ID:</span>
              <code className="text-xs bg-[var(--color-canvas-subtle)] px-1.5 py-0.5 rounded">
                {output.dkp_identifier}
              </code>
            </div>
            {output.journal_name && (
              <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                <span className="font-medium text-[var(--color-fg-default)]">Journal:</span>
                {output.journal_name}
              </div>
            )}
            {output.lab_name && (
              <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                <FlaskConical size={13} />
                {output.lab_name}
              </div>
            )}
            {output.published_date && (
              <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                <Calendar size={13} />
                {new Date(output.published_date).getFullYear()}
              </div>
            )}
            {output.doi && (
              <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                <span className="font-medium text-[var(--color-fg-default)]">DOI:</span>
                <a
                  href={`https://doi.org/${output.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent-fg)] hover:underline flex items-center gap-1"
                >
                  {output.doi} <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* File Viewer Section */}
          {output.file_url && (
            <div className="pt-4 border-t border-[var(--color-border-muted)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[var(--color-accent-fg)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-fg-default)]">Research Document</h3>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowPdf(v => !v)}
                  icon={showPdf ? <Check size={13} /> : <BookOpen size={13} />}
                >
                  {showPdf ? "Close Reader" : "Read PDF Inline"}
                </Button>
              </div>

              {showPdf ? (
                <div className="animate-fade-in">
                  <PdfPreview fileKey={output.file_url} outputId={outputId} />
                  <div className="mt-3 flex justify-end">
                    <OpenFileButton fileKey={output.file_url} outputId={outputId} />
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--color-canvas-subtle)] rounded-xl p-6 text-center border border-dashed border-[var(--color-border-default)]">
                  <FileText size={32} className="mx-auto mb-2 text-[var(--color-fg-muted)] opacity-50" />
                  <p className="text-sm text-[var(--color-fg-muted)] mb-3">PDF document is available for this research.</p>
                  <Button variant="outline" size="sm" onClick={() => setShowPdf(true)}>
                    Open PDF Reader
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Citation tools ─────────────────────────────── */}
      <div className="gh-box">
        <div className="gh-box-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
            Cite This Work
          </h2>
          {/* Tab switcher */}
          {!citationLoading && citation && (
            <div className="flex items-center gap-1 bg-[var(--color-canvas-inset)] rounded-lg p-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                    activeTab === tab.key
                      ? "bg-[var(--gradient-surface)] text-[var(--color-accent-fg)] shadow-sm"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="gh-box-body">
          {citationLoading && (
            <div className="h-24 rounded-xl bg-[var(--color-canvas-subtle)] animate-pulse" />
          )}

          {!citationLoading && citation && (
            <div className="space-y-3">
              {/* Active tab content */}
              {activeTab === "apa" && (
                <CitationBlock format="apa" text={citation.apa} title={output.title} />
              )}
              {activeTab === "mla" && (
                <CitationBlock format="mla" text={citation.mla} title={output.title} />
              )}
              {activeTab === "bibtex" && (
                <CitationBlock format="bibtex" text={citation.bibtex} title={output.title} isCode />
              )}

              {/* Quick-copy all formats */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border-muted)]">
                <span className="text-xs text-[var(--color-fg-muted)]">Quick copy:</span>
                <CopyButton text={citation.apa} label="APA" />
                <CopyButton text={citation.mla} label="MLA" />
                <CopyButton text={citation.bibtex} label="BibTeX" />
                <BibDownloadButton bibtex={citation.bibtex} title={output.title} />
              </div>
            </div>
          )}

          {!citationLoading && !citation && (
            <p className="text-sm text-[var(--color-fg-muted)]">Citation data unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
}
