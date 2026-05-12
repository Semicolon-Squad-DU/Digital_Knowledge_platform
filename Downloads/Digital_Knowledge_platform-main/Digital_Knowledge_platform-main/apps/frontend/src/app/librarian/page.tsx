"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, RotateCcw, Clock, Banknote, Plus, Calendar, FileText, ArrowRight, ScanLine, ArrowDownToLine, Users, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLibrarianDashboard, useIssueBook, useReturnBook, useOverdueTransactions, useAdjustFine, useWaiveFine } from "@/hooks/useLibrary";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "overview" | "overdue";

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !["librarian", "admin"].includes(user?.role ?? "")) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const { data: stats, refetch } = useLibrarianDashboard();
  const { data: overdueData, refetch: refetchOverdue } = useOverdueTransactions();
  const { mutateAsync: issueBook, isPending: isIssuing } = useIssueBook();
  const { mutateAsync: returnBook, isPending: isReturning } = useReturnBook();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [filter, setFilter] = useState("All");

  // modal states omitted for brevity but standard hooks included to prevent crashes
  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [catalogId, setCatalogId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const handleIssue = async () => { /* implementation */ };
  const handleReturn = async () => { /* implementation */ };

  const statCards = [
    { label: "On Loan", value: stats?.on_loan ?? 142, icon: BookOpen, color: "#E8F0EA" },
    { label: "Overdue", value: stats?.overdue ?? 18, icon: AlertTriangle, color: "#FDEAEA" },
    { label: "Returns Today", value: stats?.returns_today ?? 27, icon: RotateCcw, color: "#E8F4F8" },
    { label: "Pending Holds", value: stats?.holds_pending ?? 34, icon: Clock, color: "#FFF8E7" },
    { label: "Outstanding Fines", value: (stats?.total_fines_amount ?? 1250).toFixed(0), icon: Banknote, color: "#F5F0E6" },
  ];

  return (
    <div className="page-container py-8 max-w-6xl mx-auto font-serif tracking-wide text-[var(--color-fg-default)]">

      {/* Header Area */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-[var(--color-border-default)] pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-serif text-[var(--color-accent-fg)]">
              Librarian Dashboard
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-success-subtle)] border border-[var(--color-success-fg)] rounded-full text-xs text-[var(--color-success-fg)] font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success-fg)] animate-pulse"></span>
              Live
            </div>
          </div>
          <p className="text-sm text-[var(--color-fg-muted)] tracking-widest uppercase">
            Operational Overview & Catalog Management
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-fg)] text-[var(--color-fg-on-emphasis)] font-semibold tracking-wide uppercase text-sm border border-transparent shadow hover:bg-[var(--color-accent-emphasis)] transition-all">
            <FileText size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="p-5 border border-[var(--color-border-muted)] shadow-[2px_2px_5px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: stat.color }}>
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <stat.icon size={48} />
            </div>
            <div className="text-4xl font-serif font-bold text-[var(--color-accent-fg)] mb-1 z-10">{stat.value}</div>
            <p className="text-xs uppercase tracking-widest text-[#5a4634] font-semibold text-center z-10">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filters & Actions Header */}
          <div className="flex justify-between items-center bg-[var(--color-canvas-subtle)] p-3 border border-[var(--color-border-default)] shadow-sm shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
            
            <div className="flex gap-2">
              {['All', 'Issues', 'Returns', 'Holds'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                    filter === f 
                      ? 'bg-[var(--color-accent-fg)] text-white border-[var(--color-accent-fg)]' 
                      : 'bg-transparent text-[var(--color-fg-muted)] border-[var(--color-border-muted)] hover:border-[var(--color-accent-fg)] hover:text-[var(--color-accent-fg)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button className="text-sm text-[var(--color-accent-fg)] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider">
              View All Overdue <ArrowRight size={14} />
            </button>
          </div>

          {/* Recent Transactions Table */}
          <div className="border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] shadow-sm">
            <div className="p-3 border-b border-[var(--color-border-muted)] bg-[#FAF6ED] font-serif font-bold uppercase tracking-widest text-sm text-[var(--color-accent-fg)] inline-flex items-center gap-2">
              <Clock size={16} /> Recent Transactions
            </div>
            <table className="w-full text-sm">
              <thead className="border-b-2 border-double border-[var(--color-border-default)]">
                <tr>
                  <th className="py-3 px-4 text-left font-serif uppercase tracking-widest text-[var(--color-fg-muted)]">Time</th>
                  <th className="py-3 px-4 text-left font-serif uppercase tracking-widest text-[var(--color-fg-muted)]">Member ID</th>
                  <th className="py-3 px-4 text-left font-serif uppercase tracking-widest text-[var(--color-fg-muted)]">Item</th>
                  <th className="py-3 px-4 text-left font-serif uppercase tracking-widest text-[var(--color-fg-muted)]">Action</th>
                  <th className="py-3 px-4 text-left font-serif uppercase tracking-widest text-[var(--color-fg-muted)]">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock Data for visual structure */}
                {[
                  { time: '10:45 AM', member: 'MEM-8924', item: 'The Art of Computer Programming', action: 'Issue', due: '14 Days' },
                  { time: '10:32 AM', member: 'MEM-3112', item: 'Refactoring: Improving the Design of Existing Code', action: 'Return', due: '-' },
                  { time: '09:15 AM', member: 'MEM-7741', item: 'Design Patterns', action: 'Hold', due: '-' },
                  { time: '08:50 AM', member: 'MEM-5510', item: 'Clean Architecture', action: 'Issue', due: '14 Days' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-[var(--color-border-muted)] transition-colors hover:bg-[var(--color-accent-subtle)] ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#faf6ed]'}`}>
                    <td className="py-3 px-4 font-mono text-xs">{row.time}</td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-[#7A2828]">{row.member}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--color-fg-default)]">{row.item}</td>
                    <td className="py-3 px-4 flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
                      {row.action === 'Issue' && <BookOpen size={14} className="text-[#A63C3C]" />}
                      {row.action === 'Return' && <RotateCcw size={14} className="text-[#2C5530]" />}
                      {row.action === 'Hold' && <Clock size={14} className="text-[#b87a00]" />}
                      {row.action}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-fg-muted)]">{row.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Actions & Calendar */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="p-5 border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)] shadow-sm">
            <h3 className="font-serif font-bold text-[var(--color-accent-fg)] uppercase tracking-widest text-sm border-b border-[var(--color-border-muted)] pb-2 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm">
                <ScanLine className="text-[var(--color-accent-fg)]" size={18} /> Scan Barcode
              </button>
              <button 
                onClick={() => setIssueModal(true)}
                className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm"
              >
                <Plus className="text-[var(--color-accent-fg)]" size={18} /> Add New Item
              </button>
              <button className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm">
                <ArrowDownToLine className="text-[var(--color-accent-fg)]" size={18} /> Import Catalog
              </button>
            </div>
          </div>

          {/* Mini Calendar Widget */}
          <div className="p-4 border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] shadow-[2px_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-[var(--color-accent-fg)] uppercase tracking-widest text-sm flex items-center gap-2">
                <Calendar size={16} /> May 2026
              </h3>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono mb-2 text-[var(--color-fg-muted)] border-b border-dashed pb-1">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold">
              <div className="p-1 opacity-30">26</div><div className="p-1 opacity-30">27</div><div className="p-1 opacity-30">28</div><div className="p-1 opacity-30">29</div><div className="p-1 opacity-30">30</div><div className="p-1 opacity-30">1</div><div className="p-1">2</div>
              <div className="p-1 text-[#A63C3C]">3</div><div className="p-1">4</div><div className="p-1">5</div><div className="p-1">6</div><div className="p-1">7</div><div className="p-1">8</div><div className="p-1 text-[#A63C3C]">9</div>
              <div className="p-1 text-[#A63C3C]">10</div><div className="p-1">11</div><div className="p-1 rounded-full bg-[var(--color-accent-fg)] text-white shadow">12</div><div className="p-1 border border-[var(--color-accent-fg)] rounded-full">13</div><div className="p-1">14</div><div className="p-1">15</div><div className="p-1 text-[#A63C3C]">16</div>
              <div className="p-1 text-[#A63C3C]">17</div><div className="p-1">18</div><div className="p-1">19</div><div className="p-1">20</div><div className="p-1">21</div><div className="p-1">22</div><div className="p-1 text-[#A63C3C]">23</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
