"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, AlertTriangle, RotateCcw, Clock, Banknote, Plus, Calendar, FileText, ArrowRight, ScanLine, ArrowDownToLine, CheckCircle, X, Camera, SwitchCamera, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLibrarianDashboard, useIssueBook, useReturnBook, useOverdueTransactions } from "@/hooks/useLibrary";
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

  // Workflow states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [issueWorkflowOpen, setIssueWorkflowOpen] = useState(false);
  const [returnWorkflowOpen, setReturnWorkflowOpen] = useState(false);
  
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [scannedMember, setScannedMember] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScanning, setIsScanning] = useState(true);

  // Auto-calculate 14 days for issue
  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return formatDate(d.toISOString());
  };

  const handleSimulateScanItem = () => {
    setIsScanning(false);
    setTimeout(() => {
      setScannedItem({
        id: "cat-1234",
        title: "The Design of Everyday Things",
        author: "Don Norman",
        barcode: "B8923401",
        status: "available",
        thumbnail: "https://www.transparenttextures.com/patterns/cream-paper.png"
      });
      setBarcodeInput("");
    }, 800);
  };

  const aMockMember = {
    id: "MEM-b7c8",
    name: "Alice Johnson",
    email: "alice@example.com",
    eligible: true
  };

  const handleSimulateScanMember = () => {
    setScannedMember(aMockMember);
    setStep(3);
  };

  const handleConfirmIssue = async () => {
    toast.success("Transaction recorded");
    setStep(4);
  };

  const handleConfirmReturn = async () => {
    setStep(4);
    setTimeout(() => {
      setReturnWorkflowOpen(false);
      setScannedItem(null);
      setStep(1);
      refetch();
    }, 3000);
  };

  const statCards = [
    { label: "On Loan", value: stats?.on_loan ?? 142, icon: BookOpen, color: "#E8F0EA" },
    { label: "Overdue", value: stats?.overdue ?? 18, icon: AlertTriangle, color: "#FDEAEA" },
    { label: "Returns Today", value: stats?.returns_today ?? 27, icon: RotateCcw, color: "#E8F4F8" },
    { label: "Pending Holds", value: stats?.holds_pending ?? 34, icon: Clock, color: "#FFF8E7" },
    { label: "Outstanding Fines", value: (stats?.total_fines_amount ?? 1250).toFixed(0), icon: Banknote, color: "#F5F0E6" },
  ];

  return (
    <div className="page-container py-8 max-w-6xl mx-auto font-serif tracking-wide text-[var(--color-fg-default)] relative">

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
              <button 
                onClick={() => { setScannerOpen(true); setIsScanning(true); setScannedItem(null); }}
                className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm"
              >
                <ScanLine className="text-[var(--color-accent-fg)]" size={18} /> Scan Barcode
              </button>
              <button 
                onClick={() => { setIssueWorkflowOpen(true); setStep(1); setScannedItem(null); setScannedMember(null); }}
                className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm"
              >
                <Plus className="text-[var(--color-accent-fg)]" size={18} /> Issue Item
              </button>
              <button 
                onClick={() => { setReturnWorkflowOpen(true); setStep(1); setScannedItem(null); }}
                className="flex items-center gap-3 p-3 bg-white border border-[#E69900]/60 shadow-[inset_2px_0_0_#E69900] hover:bg-[#FFF8E7] transition-colors font-bold text-[var(--color-fg-default)] tracking-wide text-sm"
              >
                <RotateCcw className="text-[var(--color-accent-fg)]" size={18} /> Return Item
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

      {/* --- Scanner Modal UI --- */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] shadow-2xl relative overflow-hidden">
            <div className="bg-[#2c1e16] p-3 text-[var(--color-canvas-default)] flex justify-between items-center text-sm uppercase tracking-widest font-bold border-b border-[#5a4634]">
              <div className="flex items-center gap-2"><ScanLine size={16} /> Barcode Scanner</div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 hover:text-[#E69900] transition-colors"><SwitchCamera size={16} /> <span className="hidden sm:inline">Switch</span></button>
                <button onClick={() => setScannerOpen(false)} className="hover:text-red-400 transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6">
              <div className="relative w-full aspect-video bg-[#1a1310] rounded border-4 border-[#3a281d] overflow-hidden mb-5">
                {/* Viewfinder brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/60"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/60"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/60"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/60"></div>
                
                {isScanning ? (
                  <>
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#E69900] to-transparent shadow-[0_0_10px_#E69900] animate-[scan_2s_ease-in-out_infinite]" style={{ transform: "translateY(-50%)" }}></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white"><Camera size={48} className="animate-pulse" /></div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-success-fg)] bg-black/40 backdrop-blur-md font-bold uppercase tracking-widest gap-2">
                    <CheckCircle size={48} className="animate-bounce text-[#4CAF50]" />
                    <span className="text-[#4CAF50]">Scan Successful</span>
                  </div>
                )}
              </div>

              {!scannedItem ? (
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-3 flex items-center text-[var(--color-fg-muted)]"><Search size={18} /></div>
                  <input 
                    type="text" 
                    placeholder="Or enter barcode manually..." 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSimulateScanItem()}
                    className="w-full bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)] py-3 pl-10 pr-4 font-mono text-sm focus:outline-none focus:border-[var(--color-accent-fg)]"
                  />
                  <button onClick={handleSimulateScanItem} className="absolute inset-y-1 right-1 px-3 bg-[#e8e4db] text-[#5a4634] text-xs font-bold uppercase hover:bg-[#d8d3c9]">Enter</button>
                </div>
              ) : (
                <div className="border border-[var(--color-border-default)] p-4 bg-[#f8f5ee] flex gap-4 items-center">
                  <div className="w-12 h-16 bg-[#e0dacc] border border-[#c4bcab] flex-shrink-0 relative">
                     <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-[#2c1e16] opacity-20"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[var(--color-fg-default)] text-lg">{scannedItem.title}</h4>
                    <p className="text-[var(--color-fg-muted)] text-sm">{scannedItem.author}</p>
                    <p className="font-mono text-xs text-[#7A2828] mt-1 font-bold tracking-widest">{scannedItem.barcode}</p>
                  </div>
                </div>
              )}

              {scannedItem && (
                <div className="mt-5 flex gap-3">
                  <button className="flex-1 py-2.5 bg-[#4CAF50] hover:bg-[#45A049] text-white font-bold uppercase tracking-wider text-sm shadow-sm transition-colors" onClick={() => { setScannerOpen(false); setIssueWorkflowOpen(true); setStep(2); }}>Issue</button>
                  <button className="flex-1 py-2.5 bg-[#E69900] hover:bg-[#D48900] text-white font-bold uppercase tracking-wider text-sm shadow-sm transition-colors" onClick={() => { setScannerOpen(false); setReturnWorkflowOpen(true); }}>Return</button>
                  <button className="flex-1 py-2.5 bg-[var(--color-canvas-subtle)] border border-[var(--color-border-muted)] hover:bg-[#e8e4db] text-[var(--color-fg-default)] font-bold uppercase tracking-wider text-sm transition-colors">Details</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Issue Workflow --- */}
      {issueWorkflowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] shadow-2xl relative">
            <div className="bg-[#7A2828] p-4 text-white flex justify-between items-center text-sm uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2"><BookOpen size={18} /> Issue Item Workflow</div>
            </div>

            <div className="flex border-b border-[var(--color-border-default)]">
              <div className={`flex-1 py-3 text-center uppercase tracking-widest text-xs font-bold ${step >= 1 ? 'bg-[#FAF6ED] text-[#7A2828] border-b-2 border-[#7A2828]' : 'text-[var(--color-fg-muted)]'}`}>1. Select Book</div>
              <div className={`flex-1 py-3 text-center uppercase tracking-widest text-xs font-bold ${step >= 2 ? 'bg-[#FAF6ED] text-[#7A2828] border-b-2 border-[#7A2828]' : 'text-[var(--color-fg-muted)]'}`}>2. Select Member</div>
              <div className={`flex-1 py-3 text-center uppercase tracking-widest text-xs font-bold ${step >= 3 ? 'bg-[#FAF6ED] text-[#7A2828] border-b-2 border-[#7A2828]' : 'text-[var(--color-fg-muted)]'}`}>3. Confirm</div>
            </div>

            <div className="p-8">
              {step === 1 && (
                <div className="text-center space-y-4">
                  <ScanLine size={48} className="mx-auto text-[var(--color-fg-muted)] mb-4" />
                  <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Scan Book to Issue</h3>
                  <div className="max-w-xs mx-auto text-left">
                    <p className="text-xs uppercase tracking-widest text-[#7A2828] mb-1 font-bold">Manual Entry</p>
                    <div className="flex">
                      <input type="text" placeholder="Enter barcode" value={barcodeInput} onChange={(e)=>setBarcodeInput(e.target.value)} className="flex-1 border border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)] p-2 focus:outline-none" />
                      <button onClick={handleSimulateScanItem} className="bg-[#7A2828] text-white px-4 font-bold uppercase text-xs">Search</button>
                    </div>
                  </div>
                  {scannedItem && (
                    <button onClick={() => setStep(2)} className="mt-6 border-b-2 border-[#E69900] text-[#E69900] font-bold uppercase pb-1 tracking-widest hover:text-[#d38d00]">Next Step: Scan Member <ArrowRight size={14} className="inline ml-1" /></button>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="border border-[var(--color-border-default)] p-3 bg-[#f8f5ee] flex justify-between items-center opacity-70">
                     <span className="font-bold">{scannedItem?.title}</span>
                     <span className="text-xs font-mono">{scannedItem?.barcode}</span>
                  </div>
                  
                  <div className="text-center space-y-4 py-4">
                    <Users size={48} className="mx-auto text-[var(--color-fg-muted)] mb-4" />
                    <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Scan Member ID</h3>
                    <div className="max-w-xs mx-auto text-left flex">
                        <input type="text" placeholder="MEM-..." className="flex-1 border border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)] p-2 focus:outline-none" />
                        <button onClick={handleSimulateScanMember} className="bg-[#7A2828] text-white px-4 font-bold uppercase text-xs">Search</button>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="bg-[#FAF6ED] border border-[var(--color-border-default)] p-6 space-y-4 max-w-sm mx-auto shadow-inner text-left">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--color-fg-muted)] tracking-widest">Borrower</p>
                      <p className="font-bold text-lg text-[var(--color-fg-default)] flex items-center justify-between">{scannedMember?.name} <span className="text-[#4CAF50] text-xs uppercase px-2 py-0.5 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded">Eligible</span></p>
                      <p className="text-xs font-mono text-[var(--color-fg-muted)]">{scannedMember?.id}</p>
                    </div>
                    <div className="h-[1px] bg-[var(--color-border-muted)] border-b border-white"></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--color-fg-muted)] tracking-widest">Item</p>
                        <p className="font-bold text-base text-[var(--color-fg-default)]">{scannedItem?.title}</p>
                        <p className="text-xs text-[var(--color-fg-muted)] font-mono">{scannedItem?.barcode}</p>
                    </div>
                    <div className="h-[1px] bg-[var(--color-border-muted)] border-b border-white"></div>
                    <div className="bg-[#E8F0EA] p-3 border border-[#c3d6c7] text-[#2C5530] text-center">
                      <p className="text-xs uppercase font-bold tracking-widest mb-1">Due Date</p>
                      <p className="font-bold text-lg font-mono">{calculateDueDate()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-sm mx-auto pt-4">
                    <button onClick={() => setIssueWorkflowOpen(false)} className="flex-1 py-3 text-[var(--color-fg-muted)] uppercase tracking-wider text-sm font-bold border border-[var(--color-border-muted)] hover:bg-[var(--color-canvas-subtle)]">Cancel</button>
                    <button onClick={handleConfirmIssue} className="flex-1 py-3 bg-[#7A2828] hover:bg-[#5E1F1F] text-white uppercase tracking-wider text-sm font-bold shadow-md">Confirm Issue</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center space-y-6 py-6">
                  <CheckCircle size={64} className="mx-auto text-[#4CAF50]" />
                  <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Issue Complete!</h3>
                  <div className="border border-[var(--color-border-default)] p-6 max-w-sm mx-auto bg-white font-mono text-left text-sm" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(122,40,40,0.05) 24px)" }}>
                    <p className="text-center font-bold mb-4 border-b border-dashed pb-2">TRANSACTION RECEIPT</p>
                    <p>MEMBER: {scannedMember?.name}</p>
                    <p>ITEM: {scannedItem?.title}</p>
                    <p>DUE: {calculateDueDate()}</p>
                  </div>
                  <div className="flex gap-4 max-w-sm mx-auto pt-2">
                    <button onClick={() => window.print()} className="flex-1 py-2 border border-[#E69900] text-[#E69900] uppercase font-bold text-sm">Print</button>
                    <button onClick={() => { setIssueWorkflowOpen(false); setScannedItem(null); setScannedMember(null); setStep(1); }} className="flex-1 py-2 bg-[var(--color-accent-fg)] text-white uppercase font-bold text-sm">Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Return Workflow --- */}
      {returnWorkflowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px]">
          <div className="w-full max-w-lg bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] shadow-2xl relative">
            <div className="bg-[#4a3f35] p-4 text-white flex justify-between items-center text-sm uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2"><RotateCcw size={18} /> Return Item</div>
              <button onClick={() => setReturnWorkflowOpen(false)} className="hover:text-red-400"><X size={20} /></button>
            </div>

            <div className="p-8">
              {!scannedItem ? (
                <div className="text-center space-y-4">
                    <ScanLine size={48} className="mx-auto text-[var(--color-fg-muted)] mb-4" />
                    <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Scan Book to Return</h3>
                    <div className="max-w-xs mx-auto text-left flex">
                        <input type="text" placeholder="Enter barcode" value={barcodeInput} onChange={(e)=>setBarcodeInput(e.target.value)} className="flex-1 border border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)] p-2 focus:outline-none" />
                        <button onClick={handleSimulateScanItem} className="bg-[#4a3f35] text-white px-4 font-bold uppercase text-xs">Search</button>
                    </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2 mb-6">
                    <CheckCircle size={48} className="mx-auto text-[#4CAF50] mb-2" />
                    <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Item Scanned</h3>
                  </div>

                  <div className="bg-[#FAF6ED] border border-[var(--color-border-default)] p-5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-[var(--color-fg-default)]">{scannedItem.title}</p>
                            <p className="text-sm font-mono text-[var(--color-fg-muted)] mt-1">{scannedItem.barcode}</p>
                        </div>
                        <span className="bg-[#E69900] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1">Borrower: MEM-8924</span>
                    </div>

                    <div className="h-[1px] bg-dashed bg-[var(--color-border-muted)]"></div>
                    
                    <div className="bg-[#FDEAEA] border border-[#EAC1C1] p-3 text-[#A63C3C]">
                        <div className="flex justify-between font-bold text-sm mb-1 uppercase tracking-widest">
                            <span>Overdue Fine</span>
                            <span>Tk 15.00</span>
                        </div>
                        <p className="text-xs">Tk 5.00/day � 3 days late</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button className="flex-1 py-3 text-[#A63C3C] uppercase tracking-wider text-sm font-bold border border-[#A63C3C] hover:bg-[#FDEAEA]">Waive Fine</button>
                    <button onClick={handleConfirmReturn} className="flex-1 py-3 bg-[#4a3f35] hover:bg-[#342b23] text-white uppercase tracking-wider text-sm font-bold shadow-md">Confirm Return</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center space-y-6 py-6">
                  <CheckCircle size={64} className="mx-auto text-[#4CAF50]" />
                  <h3 className="font-serif text-2xl font-bold text-[var(--color-fg-default)]">Return Complete!</h3>
                  <p className="text-[var(--color-fg-muted)]">Inventory updated automatically.<br/>Redirecting to dashboard...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Keyframes for scan animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
