"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Archive, Send, BookOpen, ShieldCheck,
  Bell, Heart, Search, Plus, FileText, RefreshCw,
  PenLine, AlertTriangle, FolderOpen, HardDrive, Lock, Database,
  ArrowRight, TrendingUp, CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBorrowingHistory, useMemberFines, useWishlist } from "@/hooks/useLibrary";
import { useNotifications } from "@/hooks/useNotifications";
import { useArchiveSearch } from "@/hooks/useArchive";
import { useResearchList } from "@/hooks/useResearch";
import { useShowcaseGallery } from "@/hooks/useShowcase";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo, cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Loan       { transaction_id: string; title: string; due_date: string; status: string; }
interface ArchiveItem{ item_id: string; title_en: string; category: string; created_at: string; uploader_name?: string; }
interface Research   { output_id: string; title: string; output_type: string; published_date: string; authors?: {name:string}[]; }
interface Showcase   { project_id: string; title: string; status: string; submitted_at: string; author_name?: string; }

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },
  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: BookOpen },
  { label: "Admin",       href: "/admin", icon: ShieldCheck },
];

// ── Status pill ───────────────────────────────────────────────────────────────
const PILL: Record<string, {bg:string; color:string}> = {
  published:       { bg:"#e6f4ea", color:"#1e7e34" },
  success:         { bg:"#e6f4ea", color:"#1e7e34" },
  active:          { bg:"#e6f4ea", color:"#1e7e34" },
  approved:        { bg:"#e6f4ea", color:"#1e7e34" },
  pending:         { bg:"#e8f0fe", color:"#1a56db" },
  pending_review:  { bg:"#e8f0fe", color:"#1a56db" },
  review:          { bg:"#e8f0fe", color:"#1a56db" },
  error:           { bg:"#fde8e8", color:"#c81e1e" },
  overdue:         { bg:"#fde8e8", color:"#c81e1e" },
  draft:           { bg:"#f3f4f6", color:"#6b7280" },
};

function StatusPill({ status }: { status: string }) {
  const s = PILL[status.toLowerCase()] ?? { bg:"#f3f4f6", color:"#6b7280" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      padding:"1px 8px", borderRadius:"3px",
      fontSize:"11px", fontWeight:700,
      textTransform:"uppercase", letterSpacing:"0.05em",
      background: s.bg, color: s.color,
    }}>
      {status.replace("_"," ")}
    </span>
  );
}

// ── Activity row icon ─────────────────────────────────────────────────────────
function AIcon({ type }: { type: string }) {
  const map: Record<string, React.ElementType> = {
    archive:  FileText,
    research: RefreshCw,
    showcase: PenLine,
    overdue:  AlertTriangle,
    loan:     FolderOpen,
  };
  const Icon = map[type] ?? FileText;
  return (
    <div style={{
      width:36, height:36, borderRadius:6, flexShrink:0,
      background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <Icon size={15} color="#6b7280" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subIcon, subColor, loading }:{
  label:string; value:string|number; sub?:string;
  subIcon?: React.ElementType; subColor?:string; loading?:boolean;
}) {
  const SubIcon = subIcon;
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"20px 22px" }}>
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#9ca3af", marginBottom:8 }}>
            {label}
          </p>
          <p style={{ fontSize:36, fontWeight:800, color:"#111827", lineHeight:1.1, marginBottom:8 }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize:12, color: subColor ?? "#6b7280", display:"flex", alignItems:"center", gap:4 }}>
              {SubIcon && <SubIcon size={12} />}
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data: history,     isLoading: histLoading  } = useBorrowingHistory(user?.user_id ?? "");
  const { data: fineData                              } = useMemberFines(user?.user_id ?? "");
  const { data: notifData                             } = useNotifications(1, false, isAuthenticated);
  const { data: wishlist                              } = useWishlist();
  const { data: archiveData, isLoading: archLoading  } = useArchiveSearch({ query:"", page:1, limit:5 });
  const { data: researchData,isLoading: resLoading   } = useResearchList({ page:1, limit:5 });
  const { data: showcaseData,isLoading: showLoading  } = useShowcaseGallery({ page:1, limit:5 });

  if (!user) return null;

  const overdueLoans   = (history ?? []).filter((t:Loan) => t.status === "overdue");
  const returnedLoans  = (history ?? []).filter((t:Loan) => t.status === "returned");
  const unreadCount    = notifData?.unread_count ?? 0;
  const totalDocs      = archiveData?.total ?? 0;
  const publishedItems = researchData?.total ?? 0;
  const pendingReviews = (showcaseData?.items ?? []).filter((p:Showcase) =>
    ["pending_review","review","pending"].includes(p.status)).length;
  const archivedItems  = returnedLoans.length;

  // Activity feed — merged from real API data, sorted by time
  type Entry = { id:string; type:string; actor:string; action:string; subject:string; status:string; time:string; };
  const feed: Entry[] = [
    ...((archiveData?.items ?? []) as ArchiveItem[]).map(item => ({
      id:`a-${item.item_id}`, type:"archive",
      actor: item.uploader_name ?? "System",
      action:"uploaded", subject:`"${item.title_en}"`,
      status:"active", time: item.created_at,
    })),
    ...((researchData?.items ?? []) as Research[]).map(r => ({
      id:`r-${r.output_id}`, type:"research",
      actor: r.authors?.[0]?.name ?? "Researcher",
      action:"published", subject:`"${r.title}"`,
      status:"published", time: r.published_date,
    })),
    ...((showcaseData?.items ?? []) as Showcase[]).map(p => ({
      id:`s-${p.project_id}`, type:"showcase",
      actor: p.author_name ?? "Student",
      action:"requested a review for", subject:`"${p.title}"`,
      status: p.status, time: p.submitted_at,
    })),
    ...(overdueLoans as Loan[]).map(loan => ({
      id:`l-${loan.transaction_id}`, type:"overdue",
      actor:"Integrity check",
      action:"failed for", subject:`"${loan.title}"`,
      status:"error", time: loan.due_date,
    })),
  ]
    .filter(e => !!e.time)
    .sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  const actLoading = archLoading || resLoading || showLoading;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f2f5", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside style={{
        width:200, flexShrink:0, background:"#ffffff",
        borderRight:"1px solid #e5e7eb",
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh", overflowY:"auto",
      }}>
        {/* Logo */}
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid #f3f4f6" }}>
          <p style={{ fontSize:15, fontWeight:700, color:"#111827", lineHeight:1.3 }}>Digital Knowledge</p>
          <p style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Academic Portal</p>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ textDecoration:"none" }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 12px", borderRadius:6, marginBottom:2,
                  fontSize:13, fontWeight: active ? 600 : 500,
                  color: active ? "#111827" : "#6b7280",
                  background: active ? "#f3f4f6" : "transparent",
                  borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                  transition:"all 0.1s",
                }}>
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ════════════════ MAIN COLUMN ════════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* ── TOP BAR ── */}
        <header style={{
          height:60, background:"#ffffff",
          borderBottom:"1px solid #e5e7eb",
          display:"flex", alignItems:"center",
          padding:"0 28px", gap:16, flexShrink:0,
        }}>
          {/* Search */}
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"#f9fafb", border:"1px solid #e5e7eb",
            borderRadius:8, padding:"7px 14px",
            flex:1, maxWidth:340,
          }}>
            <Search size={14} color="#9ca3af" />
            <span style={{ fontSize:13, color:"#9ca3af" }}>Search knowledge base...</span>
            <span style={{
              marginLeft:"auto", fontSize:11, color:"#9ca3af",
              background:"#f3f4f6", border:"1px solid #e5e7eb",
              borderRadius:4, padding:"1px 6px", fontFamily:"monospace",
            }}>⌘K</span>
          </div>

          {/* Right icons */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            <Link href="/notifications" style={{
              position:"relative", width:36, height:36, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"transparent", border:"none", cursor:"pointer",
              textDecoration:"none",
            }}>
              <Bell size={18} color="#6b7280" />
              {unreadCount > 0 && (
                <span style={{
                  position:"absolute", top:6, right:6,
                  width:8, height:8, borderRadius:"50%",
                  background:"#ef4444", border:"2px solid #fff",
                }} />
              )}
            </Link>
            <Link href="/library/wishlist" style={{
              width:36, height:36, borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center",
              textDecoration:"none",
            }}>
              <Heart size={18} color="#6b7280" />
            </Link>
            {/* Avatar */}
            <Link href="/profile" style={{
              width:34, height:34, borderRadius:"50%",
              background:"#4b5563",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer",
              overflow:"hidden",
              textDecoration:"none",
            }}>
              {user.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>

          {/* Page heading row */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:800, color:"#111827", margin:0, lineHeight:1.2 }}>
                Overview Dashboard
              </h1>
              <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
                Comprehensive metrics for the academic repository
              </p>
            </div>
            <Link href="/archive" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"10px 20px", borderRadius:8,
              fontSize:13, fontWeight:600, color:"#fff",
              background:"linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)", textDecoration:"none",
              whiteSpace:"nowrap",
            }}>
              <Plus size={14} />
              New Submission
            </Link>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            <StatCard
              label="Total Documents"
              value={totalDocs.toLocaleString()}
              sub={archiveData ? `+${archiveData.items?.length ?? 0} this month` : undefined}
              subIcon={TrendingUp}
              subColor="#16a34a"
              loading={archLoading}
            />
            <StatCard
              label="Published Items"
              value={publishedItems.toLocaleString()}
              sub={publishedItems > 0 ? "Verified & Indexed" : "No published items"}
              subIcon={CheckCircle}
              subColor="#6b7280"
              loading={resLoading}
            />
            <StatCard
              label="Pending Reviews"
              value={pendingReviews}
              sub={pendingReviews > 0 ? `${pendingReviews} urgent actions` : "No pending reviews"}
              subColor={pendingReviews > 0 ? "#ef4444" : "#6b7280"}
              loading={showLoading}
            />
            <StatCard
              label="Archived Items"
              value={archivedItems.toLocaleString()}
              sub="Legacy data storage"
              subColor="#6b7280"
              loading={histLoading}
            />
          </div>

          {/* ── MIDDLE ROW ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, marginBottom:20 }}>

            {/* Recent Activity */}
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 20px", borderBottom:"1px solid #f3f4f6",
              }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:"#111827", margin:0 }}>Recent Activity</h2>
                <Link href="/notifications" style={{ fontSize:12, color:"#6b7280", textDecoration:"none" }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration="underline")}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration="none")}
                >
                  View Full Logs
                </Link>
              </div>

              {actLoading ? (
                <div style={{ padding:"0 20px" }}>
                  {Array.from({length:5}).map((_,i) => (
                    <div key={i} style={{ display:"flex", gap:12, padding:"16px 0", borderBottom: i<4?"1px solid #f9fafb":"none" }}>
                      <Skeleton className="w-9 h-9 rounded-md shrink-0" />
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div style={{ padding:"48px 20px", textAlign:"center" }}>
                  <p style={{ fontSize:13, color:"#9ca3af" }}>No recent activity</p>
                </div>
              ) : (
                feed.map((entry, i) => (
                  <div key={entry.id} style={{
                    display:"flex", alignItems:"flex-start", gap:12,
                    padding:"14px 20px",
                    borderBottom: i < feed.length-1 ? "1px solid #f9fafb" : "none",
                    transition:"background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background="#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                  >
                    <AIcon type={entry.type} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, color:"#111827", margin:"0 0 6px", lineHeight:1.4 }}>
                        <strong>{entry.actor}</strong> {entry.action} {entry.subject}.
                      </p>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:11, color:"#9ca3af" }}>Status:</span>
                        <StatusPill status={entry.status} />
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap", marginTop:2 }}>
                      {timeAgo(entry.time)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Right promo cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Library Catalog */}
              <div style={{
                flex:1, borderRadius:8, overflow:"hidden", position:"relative",
                background:"#1c2333", minHeight:200,
                display:"flex", flexDirection:"column", justifyContent:"flex-end",
                padding:20,
              }}>
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(160deg,rgba(30,40,60,0.7) 0%,rgba(10,15,25,0.95) 100%)",
                }} />
                <div style={{ position:"relative", zIndex:1 }}>
                  <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", margin:"0 0 8px" }}>Library Catalog</h3>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6, margin:"0 0 14px" }}>
                    Access {(wishlist?.length ?? 0) > 0 ? `${wishlist.length}+ wishlisted and ` : ""}academic journals and peer-reviewed papers.
                  </p>
                  <Link href="/library" style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    fontSize:13, fontWeight:600, color:"#fff", textDecoration:"none",
                  }}>
                    Browse Catalog <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Digital Archive */}
              <div style={{
                flex:1, borderRadius:8, overflow:"hidden", position:"relative",
                background:"#374151", minHeight:200,
                display:"flex", flexDirection:"column", justifyContent:"flex-end",
                padding:20,
              }}>
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(160deg,rgba(55,65,81,0.5) 0%,rgba(17,24,39,0.95) 100%)",
                }} />
                <div style={{ position:"relative", zIndex:1 }}>
                  <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", margin:"0 0 8px" }}>Digital Archive</h3>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6, margin:"0 0 14px" }}>
                    Historic preservation and legacy data management tools.
                  </p>
                  <Link href="/archive" style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    fontSize:13, fontWeight:600, color:"#fff", textDecoration:"none",
                  }}>
                    Access Records <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM STATUS BAR ── */}
          <div style={{
            background:"#fff", border:"1px solid #e5e7eb", borderRadius:8,
            display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          }}>
            {[
              {
                icon: HardDrive,
                label: "STORAGE CAPACITY",
                value: totalDocs > 0
                  ? `${Math.min(99, Math.round((totalDocs / 500) * 82))}% of 50TB utilized`
                  : "Calculating...",
              },
              {
                icon: Lock,
                label: "SECURITY STATUS",
                value: "SSL Certified & Encrypted",
              },
              {
                icon: Database,
                label: "LAST BACKUP",
                value: new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) + " at 04:00 AM",
              },
            ].map((item, i) => (
              <div key={item.label} style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"16px 24px",
                borderRight: i < 2 ? "1px solid #e5e7eb" : "none",
              }}>
                <div style={{
                  width:36, height:36, borderRadius:6, flexShrink:0,
                  background:"#f3f4f6",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <item.icon size={16} color="#6b7280" />
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#9ca3af", margin:"0 0 3px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize:13, fontWeight:600, color:"#111827", margin:0 }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
