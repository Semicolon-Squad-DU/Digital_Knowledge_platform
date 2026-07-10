"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  useImportCatalogPreview, useImportCatalogCommit,
  CatalogImportRowResult,
} from "@/features/library/hooks/useLibrary";

const CSV_TEMPLATE =
  "title,isbn,authors,publisher,edition,year,category,total_copies,shelf_location,description,barcode\n" +
  '"Introduction to Algorithms",9780262033848,"Cormen; Leiserson; Rivest","MIT Press",3rd,2009,Technology,3,A-12,,\n';

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dkp-catalog-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportCatalogModal({ isOpen, onClose }: ImportCatalogModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());

  const { mutate: preview, data: previewData, isPending: isPreviewing, reset: resetPreview } = useImportCatalogPreview();
  const { mutateAsync: commit, isPending: isCommitting, data: commitResult, reset: resetCommit } = useImportCatalogCommit();

  const handleClose = () => {
    setFile(null);
    setExcludedRows(new Set());
    resetPreview();
    resetCommit();
    onClose();
  };

  const handleFileSelect = (f: File) => {
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      toast.error("Please select a .csv or .xlsx file");
      return;
    }
    setFile(f);
    setExcludedRows(new Set());
    resetCommit();
    preview(f, { onError: () => toast.error("Could not parse this file — check the format and try again.") });
  };

  const importableRows = (previewData?.rows ?? []).filter(
    (r): r is CatalogImportRowResult & { data: NonNullable<CatalogImportRowResult["data"]> } =>
      r.data !== null && !excludedRows.has(r.row_number)
  );

  const handleCommit = async () => {
    if (importableRows.length === 0) {
      toast.error("No rows selected to import");
      return;
    }
    try {
      const result = await commit(importableRows.map((r) => r.data));
      toast.success(`Imported ${result.imported} book${result.imported === 1 ? "" : "s"}${result.failed ? `, ${result.failed} failed` : ""}`);
    } catch {
      toast.error("Import failed. Please try again.");
    }
  };

  const toggleRow = (rowNumber: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Catalog (CSV / Excel)" size="xl">
      <div className="space-y-4">
        {!commitResult && (
          <>
            {/* Step 1: file picker */}
            <div className="flex items-center justify-between">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 cursor-pointer transition-colors"
              >
                <Upload size={20} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{file ? file.name : "Choose a CSV or Excel file"}</p>
                  <p className="text-xs text-slate-400">Headers: title, isbn, authors, publisher, edition, year, category, total_copies, shelf_location, description, barcode</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="ml-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex-shrink-0"
              >
                <Download size={13} /> Template
              </button>
            </div>

            {isPreviewing && <p className="text-sm text-slate-500">Parsing and validating…</p>}

            {/* Step 2: preview summary + per-row table */}
            {previewData && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <p className="text-lg font-bold text-slate-800">{previewData.summary.total}</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">Rows</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-lg font-bold text-emerald-700">{previewData.summary.valid}</p>
                    <p className="text-[11px] text-emerald-600 uppercase tracking-wide">Valid</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                    <p className="text-lg font-bold text-amber-700">{previewData.summary.duplicate}</p>
                    <p className="text-[11px] text-amber-600 uppercase tracking-wide">Duplicate</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                    <p className="text-lg font-bold text-red-700">{previewData.summary.invalid}</p>
                    <p className="text-[11px] text-red-600 uppercase tracking-wide">Invalid</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Row</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Status</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Title</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((r) => {
                        const excluded = excludedRows.has(r.row_number);
                        return (
                          <tr key={r.row_number} className={`border-t border-slate-100 ${excluded ? "opacity-40" : ""}`}>
                            <td className="px-3 py-2 text-slate-400">{r.row_number}</td>
                            <td className="px-3 py-2">
                              {r.status === "valid" && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle size={12} /> Valid</span>}
                              {r.status === "duplicate" && <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><AlertTriangle size={12} /> Duplicate</span>}
                              {r.status === "invalid" && <span className="inline-flex items-center gap-1 text-red-600 font-medium"><XCircle size={12} /> Invalid</span>}
                            </td>
                            <td className="px-3 py-2 text-slate-700 max-w-[180px] truncate">{r.data?.title || "—"}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {r.errors.length > 0 ? r.errors.join("; ") : "—"}
                              {r.data && r.status !== "invalid" && (
                                <button
                                  type="button"
                                  onClick={() => toggleRow(r.row_number)}
                                  className="ml-2 text-[11px] font-semibold text-blue-600 hover:underline"
                                >
                                  {excluded ? "Include" : "Exclude"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 3: commit result */}
        {commitResult && (
          <div className="text-center py-6">
            <CheckCircle size={36} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Imported {commitResult.imported} book{commitResult.imported === 1 ? "" : "s"}
              {commitResult.failed > 0 && `, ${commitResult.failed} failed`}
            </p>
            {commitResult.failures.length > 0 && (
              <ul className="mt-3 text-xs text-left text-red-600 max-h-32 overflow-y-auto inline-block">
                {commitResult.failures.map((f, i) => (
                  <li key={i}>{f.title}: {f.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="invisible" onClick={handleClose}>
            {commitResult ? "Close" : "Cancel"}
          </Button>
          {!commitResult && previewData && (
            <Button
              onClick={handleCommit}
              loading={isCommitting}
              disabled={importableRows.length === 0}
              icon={<FileSpreadsheet size={14} />}
              style={{ background: "var(--theme-sidebar-gradient)", color: "#fff", border: "none" }}
            >
              Import {importableRows.length} Book{importableRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
