"use client";

import { useState } from "react";
import { Download, FileText, Filter } from "lucide-react";
import { useCirculationReport } from "@/features/library/hooks/useLibrary";
import { downloadCsv, downloadReportPdf } from "@/lib/reports";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
  { value: "overdue", label: "Overdue" },
];

function defaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function CirculationReportPanel() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(today());
  const [status, setStatus] = useState("all");
  const { data, isLoading, refetch, isFetching } = useCirculationReport({ from, to, status }, true);

  const headers = ["Title", "ISBN", "Member", "Email", "Issue Date", "Due Date", "Return Date", "Status", "Fine (Tk)", "Renewals"];

  const rows = (data?.transactions ?? []).map((t) => [
    t.title, t.isbn ?? "", t.member_name, t.member_email,
    t.issue_date, t.due_date, t.return_date ?? "",
    t.status, Number(t.fine_amount).toFixed(2), t.renewal_count,
  ]);

  const handleExportCsv = () => {
    downloadCsv(`circulation-report-${from}_to_${to}.csv`, headers, rows);
  };

  const handleExportPdf = () => {
    downloadReportPdf(`circulation-report-${from}_to_${to}.pdf`, `Circulation Report (${from} to ${to})`, headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="form-input text-sm px-3 py-1.5 rounded-md border border-slate-300" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="form-input text-sm px-3 py-1.5 rounded-md border border-slate-300" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input text-sm px-3 py-1.5 rounded-md border border-slate-300">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Button variant="outline" size="sm" icon={<Filter size={13} />} onClick={() => refetch()} loading={isFetching}>
          Apply
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={handleExportCsv} disabled={!rows.length}>
          Export CSV
        </Button>
        <Button variant="outline" size="sm" icon={<FileText size={13} />} onClick={handleExportPdf} disabled={!rows.length}>
          Export PDF
        </Button>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: "Issued", value: data.summary.total_issued },
            { label: "Returned", value: data.summary.total_returned },
            { label: "Overdue", value: data.summary.total_overdue },
            { label: "Total Fines (Tk)", value: data.summary.total_fines.toFixed(0) },
            { label: "Collected (Tk)", value: data.summary.fines_collected.toFixed(0) },
            { label: "Pending (Tk)", value: data.summary.fines_pending.toFixed(0) },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100">
          <CardTitle>Transactions</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" aria-label="Circulation report transactions">
            <thead>
              <tr>
                <th>Title</th><th>Member</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Status</th><th>Fine</th><th>Renewals</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)
              ) : !data?.transactions?.length ? (
                <tr><td colSpan={8}><EmptyState icon={<FileText size={22} />} title="No transactions in this range" className="py-8" /></td></tr>
              ) : (
                data.transactions.map((t) => (
                  <tr key={t.transaction_id}>
                    <td className="max-w-xs"><span className="line-clamp-1 text-slate-700">{t.title}</span></td>
                    <td className="font-medium text-slate-900">{t.member_name}</td>
                    <td className="text-slate-500 text-xs">{formatDate(t.issue_date)}</td>
                    <td className="text-slate-500 text-xs">{formatDate(t.due_date)}</td>
                    <td className="text-slate-500 text-xs">{t.return_date ? formatDate(t.return_date) : "—"}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-orange-600 font-medium">{Number(t.fine_amount).toFixed(2)}</td>
                    <td className="text-slate-500">{t.renewal_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
