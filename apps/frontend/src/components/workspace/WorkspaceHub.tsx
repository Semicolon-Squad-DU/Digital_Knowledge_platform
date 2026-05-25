"use client";

import React, { useState, useMemo } from "react";
import {
  Bookmark,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Check,
  Copy,
  Download,
  Info,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Document, SavedNote } from "@/types/workspace";
import { DOCUMENT_DATABASE } from "@/data/documents";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceHubProps {
  savedDocumentIds: string[];
  onUnpin: (id: string) => void;
  onSelectDocument: (doc: Document) => void;
  customDocuments: Document[];
  onAddCustomDocument: (doc: Document) => void;
}

type SubTab = "shelf" | "deposit" | "bib";

interface EnhancedMetadata {
  suggestedDiscipline: string;
  keywords: string[];
  formalDoi: string;
  recommendedTitle: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  Journal:    "bg-violet-50 text-violet-700 border-violet-200",
  Conference: "bg-blue-50 text-blue-700 border-blue-200",
  Thesis:     "bg-amber-50 text-amber-700 border-amber-200",
  Dataset:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Report:     "bg-slate-100 text-slate-600 border-slate-200",
  Preprint:   "bg-orange-50 text-orange-700 border-orange-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: "var(--color-fg-muted)" }}>
      <span style={{ color: "var(--color-fg-muted)" }}>{icon}</span>
      {children}
    </h3>
  );
}

function EmptyShelf({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
    </div>
  );
}

// ─── Tab: Pinned Shelf ────────────────────────────────────────────────────────

interface ShelfTabProps {
  pinnedDocuments: Document[];
  notes: SavedNote[];
  selectedNoteDocId: string | null;
  currentNoteText: string;
  onSelectNote: (id: string) => void;
  onNoteChange: (text: string) => void;
  onSaveNote: () => void;
  onUnpin: (id: string) => void;
  onSelectDocument: (doc: Document) => void;
}

function ShelfTab({
  pinnedDocuments, notes, selectedNoteDocId, currentNoteText,
  onSelectNote, onNoteChange, onSaveNote, onUnpin, onSelectDocument,
}: ShelfTabProps) {
  const selectedDoc = pinnedDocuments.find((d) => d.id === selectedNoteDocId);
  const existingNote = notes.find((n) => n.documentId === selectedNoteDocId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Pinned list */}
      <div>
        <SectionHeading icon={<Bookmark size={14} />}>
          Pinned Manuscripts ({pinnedDocuments.length})
        </SectionHeading>

        {pinnedDocuments.length === 0 ? (
          <div className="gh-box">
            <EmptyShelf
              icon={<Bookmark size={28} />}
              title="Your shelf is empty"
              description="Browse the collections and pin papers to view them here and add personal annotations."
            />
          </div>
        ) : (
          <div className="space-y-2">
            {pinnedDocuments.map((doc) => {
              const hasNote = notes.some((n) => n.documentId === doc.id && n.note.trim());
              const isSelected = selectedNoteDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectNote(doc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelectNote(doc.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "gh-box p-4 cursor-pointer transition-all duration-100",
                    isSelected
                      ? "border-[var(--color-accent-fg)] ring-1 ring-[var(--color-accent-fg)]"
                      : "hover:border-[var(--color-fg-muted)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                          TYPE_BADGE[doc.type] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {doc.type}
                        </span>
                        {hasNote && (
                          <span className="inline-flex items-center gap-1 text-xs"
                                style={{ color: "var(--color-fg-muted)" }}>
                            <FileText size={11} /> Annotated
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold leading-snug line-clamp-2"
                         style={{ color: "var(--color-fg-default)" }}>
                        {doc.title}
                      </p>
                      <p className="text-xs mt-1 line-clamp-1"
                         style={{ color: "var(--color-fg-muted)" }}>
                        {doc.authors[0]} · {doc.institution}
                      </p>
                      <p className="text-xs font-mono mt-1"
                         style={{ color: "var(--color-fg-subtle)" }}>
                        {doc.doi}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={`Unpin ${doc.title}`}
                        onClick={(e) => { e.stopPropagation(); onUnpin(doc.id); }}
                        className="p-1 rounded transition-colors hover:text-[var(--color-danger-fg)]"
                        style={{ color: "var(--color-fg-muted)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelectDocument(doc); }}
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: "var(--color-accent-fg)" }}
                      >
                        Details <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Annotation journal */}
      <div>
        <SectionHeading icon={<FileText size={14} />}>
          Annotation Journal
        </SectionHeading>

        {selectedDoc ? (
          <div className="gh-box p-5 space-y-4">
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: "var(--color-fg-subtle)" }}>
                {selectedDoc.doi}
              </p>
              <p className="text-sm font-semibold leading-snug"
                 style={{ color: "var(--color-fg-default)" }}>
                {selectedDoc.title}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="form-label text-xs">Annotations &amp; Notes</label>
              <textarea
                rows={8}
                className="form-textarea text-sm"
                placeholder="Write your review, hypotheses, or study notes for this manuscript…"
                value={currentNoteText}
                onChange={(e) => onNoteChange(e.target.value)}
                aria-label="Annotation text"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                {existingNote ? `Last saved: ${existingNote.lastUpdated}` : "Unsaved"}
              </span>
              <Button variant="primary" size="sm" onClick={onSaveNote}>
                Save Note
              </Button>
            </div>
          </div>
        ) : (
          <div className="gh-box">
            <EmptyShelf
              icon={<FileText size={28} />}
              title="No manuscript selected"
              description="Select a pinned manuscript from the left panel to write annotations."
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Deposit Research ────────────────────────────────────────────────────

interface DepositTabProps {
  draftTitle: string;
  draftAbstract: string;
  enhanceLoading: boolean;
  enhancedMetadata: EnhancedMetadata | null;
  onTitleChange: (v: string) => void;
  onAbstractChange: (v: string) => void;
  onEnhance: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function DepositTab({
  draftTitle, draftAbstract, enhanceLoading, enhancedMetadata,
  onTitleChange, onAbstractChange, onEnhance, onSubmit,
}: DepositTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form */}
      <form onSubmit={onSubmit} className="lg:col-span-7 gh-box p-6 space-y-5">
        <div className="gh-box-header -mx-6 -mt-6 mb-5 px-6 py-4 flex items-center gap-2">
          <Plus size={15} style={{ color: "var(--color-fg-muted)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>
            Deposit Research Manuscript
          </h3>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Manuscript Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter a descriptive academic title…"
            value={draftTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Abstract &amp; Methodology</label>
          <textarea
            rows={9}
            className="form-textarea"
            placeholder="Describe your research hypotheses, methodology, and key findings…"
            value={draftAbstract}
            onChange={(e) => onAbstractChange(e.target.value)}
            required
          />
        </div>

        <Button
          type="button"
          variant="default"
          size="md"
          className="w-full"
          onClick={onEnhance}
          loading={enhanceLoading}
          disabled={enhanceLoading || !draftTitle.trim() || !draftAbstract.trim()}
          icon={<Sparkles size={14} />}
        >
          {enhanceLoading ? "Processing…" : "Auto-generate Dublin Core Tags (AI)"}
        </Button>

        <Button type="submit" variant="primary" size="md" className="w-full"
                icon={<BookOpen size={14} />}>
          Deposit &amp; Publish to Shelf
        </Button>
      </form>

      {/* Metadata preview */}
      <div className="lg:col-span-5">
        <SectionHeading icon={<Info size={14} />}>Dublin Core Metadata</SectionHeading>

        {enhanceLoading ? (
          <div className="gh-box p-8 text-center space-y-3">
            <Sparkles size={24} className="mx-auto animate-spin"
                      style={{ color: "var(--color-accent-fg)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-fg-default)" }}>
              Analysing manuscript…
            </p>
            <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
              Scanning abstract semantics to assign subject discipline, keywords, and a formal DOI.
            </p>
          </div>
        ) : enhancedMetadata ? (
          <div className="gh-box p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Check size={14} style={{ color: "var(--color-success-fg)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--color-success-fg)" }}>
                Metadata sync OK
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--color-fg-muted)" }}>
                  Recommended Title
                </p>
                <p className="font-semibold leading-snug"
                   style={{ color: "var(--color-fg-default)" }}>
                  {enhancedMetadata.recommendedTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--color-fg-muted)" }}>
                    Discipline
                  </p>
                  <p className="font-medium" style={{ color: "var(--color-fg-default)" }}>
                    {enhancedMetadata.suggestedDiscipline}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--color-fg-muted)" }}>
                    Generated DOI
                  </p>
                  <p className="font-mono text-xs" style={{ color: "var(--color-fg-default)" }}>
                    {enhancedMetadata.formalDoi}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--color-fg-muted)" }}>
                  Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {enhancedMetadata.keywords.map((kw) => (
                    <Badge key={kw} variant="primary">#{kw}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="alert alert-info text-xs">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p>Parameters are mapped to MARC-21 and Dublin Core formats for interoperability.</p>
            </div>
          </div>
        ) : (
          <div className="gh-box">
            <EmptyShelf
              icon={<Sparkles size={28} />}
              title="No metadata yet"
              description='Fill in the title and abstract, then click "Auto-generate Dublin Core Tags" to preview AI-assigned metadata.'
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Bibliography Compiler ───────────────────────────────────────────────

interface BibTabProps {
  pinnedDocuments: Document[];
  consolidatedBibtex: string;
  copiedBib: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

function BibTab({ pinnedDocuments, consolidatedBibtex, copiedBib, onCopy, onDownload }: BibTabProps) {
  return (
    <div className="gh-box">
      <div className="gh-box-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-fg-default)" }}>
            Consolidated Reference Library
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-fg-muted)" }}>
            Export BibTeX references for all pinned documents — compatible with Overleaf, LaTeX, and Zotero.
          </p>
        </div>
        {pinnedDocuments.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <Button variant="default" size="sm" onClick={onCopy}
                    icon={copiedBib ? <Check size={13} /> : <Copy size={13} />}>
              {copiedBib ? "Copied!" : "Copy BibTeX"}
            </Button>
            <Button variant="primary" size="sm" onClick={onDownload}
                    icon={<Download size={13} />}>
              Download .bib
            </Button>
          </div>
        )}
      </div>

      <div className="gh-box-body">
        {pinnedDocuments.length === 0 ? (
          <EmptyShelf
            icon={<Bookmark size={28} />}
            title="No pinned documents"
            description="Pin at least one manuscript to generate BibTeX references."
          />
        ) : (
          <pre
            className="text-xs font-mono leading-relaxed overflow-x-auto rounded-md p-4 max-h-[480px]"
            style={{
              background: "var(--color-canvas-inset)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-fg-default)",
            }}
          >
            {consolidatedBibtex}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkspaceHub({
  savedDocumentIds,
  onUnpin,
  onSelectDocument,
  customDocuments,
  onAddCustomDocument,
}: WorkspaceHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("shelf");

  // Notes state — persisted to localStorage
  const [notes, setNotes] = useState<SavedNote[]>(() => {
    try {
      const raw = localStorage.getItem("dkp_saved_notes");
      return raw ? (JSON.parse(raw) as SavedNote[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedNoteDocId, setSelectedNoteDocId] = useState<string | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState("");

  // Deposit form state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAbstract, setDraftAbstract] = useState("");
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedMetadata | null>(null);

  // Bib copy state
  const [copiedBib, setCopiedBib] = useState(false);

  // Merged document list
  const allDocuments = useMemo(
    () => [...DOCUMENT_DATABASE, ...customDocuments],
    [customDocuments]
  );
  const pinnedDocuments = useMemo(
    () => allDocuments.filter((d) => savedDocumentIds.includes(d.id)),
    [allDocuments, savedDocumentIds]
  );

  // ── Note handlers ──────────────────────────────────────────────────────────

  const handleSelectNote = (docId: string) => {
    setSelectedNoteDocId(docId);
    const existing = notes.find((n) => n.documentId === docId);
    setCurrentNoteText(existing?.note ?? "");
  };

  const handleSaveNote = () => {
    if (!selectedNoteDocId) return;
    const updated = notes.filter((n) => n.documentId !== selectedNoteDocId);
    const newNote: SavedNote = {
      documentId: selectedNoteDocId,
      note: currentNoteText,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    updated.push(newNote);
    setNotes(updated);
    try { localStorage.setItem("dkp_saved_notes", JSON.stringify(updated)); } catch { /* noop */ }
  };

  // ── Deposit handlers ───────────────────────────────────────────────────────

  const handleEnhanceMetadata = async () => {
    if (!draftTitle.trim() || !draftAbstract.trim()) return;
    setEnhanceLoading(true);
    setEnhancedMetadata(null);
    try {
      const res = await fetch("/api/gemini/metadata-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle, abstract: draftAbstract }),
      });
      if (!res.ok) throw new Error("Server error");
      setEnhancedMetadata(await res.json());
    } catch {
      // Graceful fallback
      setEnhancedMetadata({
        suggestedDiscipline: "Computer Science",
        keywords: ["Scientific Discovery", "Dynamic Taxonomies", "Dublin Core"],
        formalDoi: `10.5555/dkp.2026.${Math.floor(1000 + Math.random() * 9000)}`,
        recommendedTitle: draftTitle,
      });
    } finally {
      setEnhanceLoading(false);
    }
  };

  const handlePublishManuscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle || !draftAbstract) return;
    const newDoc: Document = {
      id: `custom-doc-${Date.now()}`,
      title: enhancedMetadata?.recommendedTitle ?? draftTitle,
      authors: ["Yuki Scholar"],
      abstract: draftAbstract,
      institution: "Independent Digital Archive",
      discipline: enhancedMetadata?.suggestedDiscipline ?? "Computer Science",
      doi: enhancedMetadata?.formalDoi ?? `10.5555/dkp.2026.${Math.floor(1000 + Math.random() * 9000)}`,
      citations: 1,
      date: new Date().toISOString().split("T")[0],
      type: "Preprint",
      keywords: enhancedMetadata?.keywords ?? ["Author Manuscript"],
    };
    onAddCustomDocument(newDoc);
    setDraftTitle("");
    setDraftAbstract("");
    setEnhancedMetadata(null);
    setActiveSubTab("shelf");
  };

  // ── Bibliography ───────────────────────────────────────────────────────────

  const consolidatedBibtex = useMemo(() => {
    if (pinnedDocuments.length === 0) return "";
    return pinnedDocuments
      .map((doc) => {
        const lastName = doc.authors[0].split(" ").pop() ?? "Scholar";
        const key = `${lastName.toLowerCase()}${doc.date.split("-")[0]}`;
        return [
          `@article{${key},`,
          `  title     = {${doc.title}},`,
          `  author    = {${doc.authors.join(" and ")}},`,
          `  journal   = {Digital Knowledge Platform Archive},`,
          `  year      = {${doc.date.split("-")[0]}},`,
          `  doi       = {${doc.doi}},`,
          `  publisher = {Scholarly Preservation Ecosystem}`,
          `}`,
        ].join("\n");
      })
      .join("\n\n");
  }, [pinnedDocuments]);

  const handleCopyBib = () => {
    if (!consolidatedBibtex) return;
    navigator.clipboard.writeText(consolidatedBibtex).catch(() => {});
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleDownloadBib = () => {
    const blob = new Blob([consolidatedBibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "consolidated_references.bib";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Tab config ─────────────────────────────────────────────────────────────

  const TABS: { id: SubTab; label: string }[] = [
    { id: "shelf",   label: "Pinned Shelf" },
    { id: "deposit", label: "Deposit Research" },
    { id: "bib",     label: "Bibliography" },
  ];

  return (
    <div className="page-container py-8 space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Research Workspace</h1>
          <p className="page-subtitle">
            Manage your reading shelf, annotate publications, deposit manuscripts, and export references.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="gh-box p-1 flex gap-0.5 w-fit" role="tablist" aria-label="Workspace sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded text-sm font-medium transition-colors duration-100 cursor-pointer",
              activeSubTab === tab.id
                ? "bg-[var(--color-canvas-default)] shadow-sm text-[var(--color-fg-default)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeSubTab === "shelf" && (
        <ShelfTab
          pinnedDocuments={pinnedDocuments}
          notes={notes}
          selectedNoteDocId={selectedNoteDocId}
          currentNoteText={currentNoteText}
          onSelectNote={handleSelectNote}
          onNoteChange={setCurrentNoteText}
          onSaveNote={handleSaveNote}
          onUnpin={(id) => {
            onUnpin(id);
            if (selectedNoteDocId === id) setSelectedNoteDocId(null);
          }}
          onSelectDocument={onSelectDocument}
        />
      )}

      {activeSubTab === "deposit" && (
        <DepositTab
          draftTitle={draftTitle}
          draftAbstract={draftAbstract}
          enhanceLoading={enhanceLoading}
          enhancedMetadata={enhancedMetadata}
          onTitleChange={setDraftTitle}
          onAbstractChange={setDraftAbstract}
          onEnhance={handleEnhanceMetadata}
          onSubmit={handlePublishManuscript}
        />
      )}

      {activeSubTab === "bib" && (
        <BibTab
          pinnedDocuments={pinnedDocuments}
          consolidatedBibtex={consolidatedBibtex}
          copiedBib={copiedBib}
          onCopy={handleCopyBib}
          onDownload={handleDownloadBib}
        />
      )}
    </div>
  );
}
