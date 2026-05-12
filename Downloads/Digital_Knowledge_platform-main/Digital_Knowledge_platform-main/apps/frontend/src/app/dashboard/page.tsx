"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, AlertTriangle, Bell, ArrowRight, Banknote, List, Bookmark, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory, useMemberFines } from "@/hooks/useLibrary";
import { useNotifications } from "@/hooks/useNotifications";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

// Dummy data for wishlist and holds according to the aesthetics requirement
const wishlist = [
  { id: 1, title: "The Design of Everyday Things", author: "Don Norman" },
  { id: 2, title: "Clean Code", author: "Robert C. Martin" },
];

const holdRequests = [
  { id: 1, title: "Thinking, Fast and Slow", position: 2, status: "Pending" },
  { id: 2, title: "The Pragmatic Programmer", position: 1, status: "Ready for Pickup" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data: history } = useBorrowingHistory(user?.user_id ?? "");
  const { data: fineData } = useMemberFines(user?.user_id ?? "");
  const { data: notifData } = useNotifications(1, false, isAuthenticated);

  if (!user) return null;

  const activeLoans  = history?.filter((t: any) => t.status === "active")  ?? [];
  const overdueLoans = history?.filter((t: any) => t.status === "overdue") ?? [];
  const completedLoans = history?.filter((t: any) => t.status !== "active" && t.status !== "overdue") ?? [];
  const totalFines   = fineData?.total_pending ?? 0;

  const getDueDateColor = (dateStr: string) => {
    const due = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return "var(--color-danger-fg)"; // Overdue
    if (diffDays <= 3) return "#b87a00"; // Amber for closing in
    return "var(--color-success-fg)"; // Green for plenty of time
  };

  const getDueDateLabel = (dateStr: string) => {
    const due = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    if (diffDays <= 3) return `Due in ${diffDays} days`;
    return `Due on ${formatDate(dateStr)}`;
  };

  return (
    <div className="page-container py-8 max-w-5xl mx-auto font-serif tracking-wide text-[var(--color-fg-default)]">
      
      {/* Page header */}
      <div className="mb-10 text-center relative">
        <div className="absolute left-0 top-1/2 w-full h-[1px] bg-[var(--color-border-default)] -z-10"></div>
        <div className="inline-block px-6 bg-[var(--color-canvas-default)]">
          <h1 className="text-3xl font-bold font-serif italic text-[var(--color-accent-fg)]">
            Personal Library Account
          </h1>
          <p className="text-sm mt-1 text-[var(--color-fg-muted)] tracking-widest uppercase">
            {user.name} · Member ID: {user.user_id.split("-")[0]}
          </p>
        </div>
      </div>

      {/* Quick Stats Widget */}
      <div className="flex flex-wrap md:flex-nowrap justify-between gap-4 mb-10 pb-8 border-b border-[var(--color-border-muted)]">
        {[
          { label: "Active Borrows", value: activeLoans.length, icon: BookOpen },
          { label: "Pending Holds", value: holdRequests.length, icon: Clock },
          { label: "Wishlist", value: wishlist.length, icon: Bookmark },
          { label: "Fines Due", value: `Tk ${totalFines.toFixed(0)}`, icon: Banknote },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center justify-center p-4 bg-[var(--color-canvas-subtle)] shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] border border-[var(--color-border-muted)] relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-subtle)] to-transparent"></div>
            <stat.icon className="text-[var(--color-accent-fg)] mb-2 opacity-80" size={24} />
            <div className="text-3xl font-serif font-bold text-[var(--color-fg-default)]">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-fg-muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Active Borrows (Book Spines) */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b-2 border-double border-[var(--color-accent-subtle)] pb-2">
              <h2 className="text-xl font-bold font-serif flex items-center gap-2 text-[var(--color-accent-fg)]">
                <BookOpen size={20} /> Active Borrows
              </h2>
            </div>
            
            <div className="space-y-4">
              {activeLoans.length === 0 && overdueLoans.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[var(--color-border-muted)] bg-[var(--color-canvas-subtle)]">
                  <p className="italic text-[var(--color-fg-muted)]">Your library shelf is currently empty.</p>
                </div>
              ) : (
                [...overdueLoans, ...activeLoans].map((loan: any) => {
                  const isOverdue = loan.status === "overdue" || new Date(loan.due_date) < new Date();
                  return (
                    <div 
                      key={loan.transaction_id}
                      className={`flex relative overflow-hidden transition-all duration-300 hover:shadow-lg rounded-sm border ${isOverdue ? 'border-[#D28E8C] bg-[#FDF5F5]' : 'border-[var(--color-border-default)] bg-gradient-to-br from-[var(--color-canvas-default)] to-[var(--color-canvas-subtle)]'}`}
                      style={{ boxShadow: "4px 4px 10px rgba(0,0,0,0.05)" }}
                    >
                      {/* Book Spine Texture */}
                      <div className="w-4 flex flex-col justify-between py-2 border-r border-[var(--color-border-muted)] opacity-70" style={{ background: isOverdue ? "#D28E8C" : "var(--color-accent-fg)" }}>
                        <div className="w-full h-[1px] bg-black/20"></div>
                        <div className="w-full h-[1px] bg-black/20"></div>
                      </div>
                      
                      <div className="flex-1 p-4 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                        <div>
                          <h3 className="font-bold text-lg text-[var(--color-fg-default)]">{loan.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span 
                              className="text-sm font-semibold tracking-wide"
                              style={{ color: getDueDateColor(loan.due_date) }}
                            >
                              {getDueDateLabel(loan.due_date)}
                            </span>
                            {isOverdue && (
                              <span className="text-xs uppercase bg-[#D28E8C]/20 text-[#A63C3C] px-2 py-0.5 rounded-[2px] font-bold tracking-widest border border-[#D28E8C]/50">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button className="text-sm text-[var(--color-accent-fg)] uppercase tracking-wider font-semibold border-b border-transparent hover:border-[var(--color-accent-fg)] transition-all">
                          Renew
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Borrowing History */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b-2 border-double border-[var(--color-accent-subtle)] pb-2">
              <h2 className="text-xl font-bold font-serif flex items-center gap-2 text-[var(--color-accent-fg)]">
                <List size={20} /> Borrowing History
              </h2>
            </div>
            
            <div className="border border-[var(--color-border-default)] shadow-sm bg-[var(--color-canvas-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-canvas-subtle)] border-b border-[var(--color-border-default)]">
                    <th className="text-left font-serif py-3 px-4 uppercase tracking-widest text-[#7c6551]">Title</th>
                    <th className="text-left font-serif py-3 px-4 uppercase tracking-widest text-[#7c6551]">Borrowed</th>
                    <th className="text-left font-serif py-3 px-4 uppercase tracking-widest text-[#7c6551]">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {completedLoans.slice(0, 5).map((loan: any, i: number) => (
                    <tr key={i} className={`border-b border-[var(--color-border-muted)] ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#faf6ed]'}`}>
                      <td className="py-3 px-4 text-[var(--color-fg-default)]">{loan.title}</td>
                      <td className="py-3 px-4 text-[var(--color-fg-muted)]">{formatDate(loan.created_at)}</td>
                      <td className="py-3 px-4 text-[var(--color-fg-muted)]">{loan.due_date ? formatDate(loan.due_date) : "N/A"}</td>
                    </tr>
                  ))}
                  {completedLoans.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center italic text-[var(--color-fg-muted)]">No historical records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Sidebar Area (Right Column) */}
        <div className="space-y-8">
          
          {/* Fines Receipt */}
          <section className="bg-[#f9f3e4] border border-[#d3ccb8] p-6 shadow-[2px_4px_8px_rgba(0,0,0,0.05)] relative font-mono text-sm leading-relaxed" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(122,40,40,0.05) 24px)" }}>
            <div className="absolute top-0 left-0 w-full h-2 flex gap-1 px-2" style={{ background: "linear-gradient(-45deg, transparent 4px, #f9f3e4 0), linear-gradient(45deg, transparent 4px, #f9f3e4 0)", backgroundSize: "8px 8px"}} />
            
            <h2 className="text-center font-bold text-lg mb-6 uppercase tracking-wider text-[#4a3f35] border-b border-dashed border-[#a69d8b] pb-2">
              Library Fines
            </h2>
            
            {!fineData?.fines || fineData.fines.length === 0 ? (
              <p className="text-center text-[#7a6b5c] my-4 italic">No outstanding balance.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {fineData.fines.map((fine: any, j: number) => (
                  <div key={j} className="flex justify-between items-end border-b border-dotted border-[#d3ccb8] pb-1">
                    <span className="text-[#4a3f35] w-2/3 truncate">{fine.book_title}</span>
                    <span className="text-[#8c2b2b] font-semibold">Tk {fine.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="my-4 border-t-2 border-double border-[#a69d8b] pt-2 flex justify-between items-center font-bold text-base">
              <span className="text-[#4a3f35]">Total Due:</span>
              <span className="text-[#8c2b2b]">Tk {(fineData?.total_pending ?? 0).toFixed(2)}</span>
            </div>
            
            <div className="text-center mt-6 text-xs text-[#a69d8b] uppercase">
              <p>Keep your account in good standing</p>
            </div>
          </section>

          {/* Hold Requests Queue */}
          <section>
            <h3 className="font-serif font-bold text-[var(--color-accent-fg)] border-b border-[var(--color-border-default)] mb-3 pb-1 uppercase tracking-widest text-sm">
              Hold Requests
            </h3>
            <div className="space-y-3">
              {holdRequests.map((req) => (
                <div key={req.id} className="p-3 bg-[var(--color-canvas-subtle)] border-l-2 border-[var(--color-accent-fg)] flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-medium text-sm text-[var(--color-fg-default)]">{req.title}</h4>
                    <p className={`text-xs mt-1 ${req.status === 'Ready for Pickup' ? 'text-[var(--color-success-fg)] font-bold' : 'text-[var(--color-fg-muted)]'}`}>
                      {req.status} (Pos. #{req.position})
                    </p>
                  </div>
                  {req.status === 'Ready for Pickup' && (
                    <Bell size={16} className="text-[var(--color-success-fg)] animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Wishlist Grid */}
          <section>
            <h3 className="font-serif font-bold text-[var(--color-accent-fg)] border-b border-[var(--color-border-default)] mb-3 pb-1 uppercase tracking-widest text-sm text-center">
              Personal Wishlist
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {wishlist.map((item) => (
                <div key={item.id} className="relative group p-2 border border-[var(--color-border-muted)] bg-[var(--color-canvas-default)] text-center transition-all hover:bg-[#FAF6ED]">
                  <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[#A63C3C] hover:bg-[#D28E8C]/20 rounded-full transition-all">
                    <Trash2 size={12} />
                  </button>
                  <div className="w-full aspect-[2/3] bg-[var(--color-canvas-subtle)] mb-2 flex items-center justify-center border border-[var(--color-border-default)] overflow-hidden shadow-inner">
                    <p className="text-[10px] uppercase text-center p-1 text-[#8B7355] font-serif leading-tight">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-[11px] uppercase tracking-wide truncate mt-1 text-[#7A2828] font-semibold">{item.title}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
