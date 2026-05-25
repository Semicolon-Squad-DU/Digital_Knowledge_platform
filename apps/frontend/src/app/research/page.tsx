"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Plus, FlaskConical, ExternalLink, Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Status pill ───────────────────────────────────────────────────────────────
const PILL: Record<string, {bg:string; color:string}> = {
  published:  { bg:"#e6f4ea", color:"#1e7e34" },
  journal:    { bg:"#e8f0fe", color:"#1a56db" },
  conference: { bg:"#e8f0fe", color:"#1a56db" },
  thesis:     { bg:"#f3f4f6", color:"#6b7280" },
  dataset:    { bg:"#e6f4ea", color:"#1e7e34" },
  report:     { bg:"#f3f4f6", color:"#6b7280" },
};

function ResearchCard({ item, onView }: {
  item: {
    output_id: string;
    title: string;
    abstract?: string;
    authors?: Array<{ name: string }>;
    output_type: string;
    published_date: string;
    journal_name?: string;
    doi?: string;
    dkp_identifier: string;
  };
  onView: (id: string) => void;
}) {
  const typePill = PILL[item.output_type] ?? { bg:"#f3f4f6", color:"#6b7280" };
  return (
    <div style={{
      background:"#fff", border:"1px solid #e5e7eb", borderRadius:10,
      padding:"16px", cursor:"pointer",
      transition:"all 0.2s", display:"flex", gap:12,
    }} onClick={() => onView(item.output_id)}>
      <div style={{
        width:42, height:42, borderRadius:8, background:typePill.bg,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>
        <FlaskConical size={20} color={typePill.color} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
          <span style={{
            display:"inline-block", fontSize:10, fontWeight:700, textTransform:"uppercase",
            padding:"2px 8px", borderRadius:4, background:typePill.bg, color:typePill.color,
          }}>
            {item.output_type}
          </span>
          {item.published_date && (
            <span style={{ fontSize:12, color:"#9ca3af", display:"flex", alignItems:"center", gap:4 }}>
              <Calendar size={12} /> {formatDate(item.published_date)}
            </span>
          )}
        </div>
        <p style={{ fontSize:14, fontWeight:600, color:"#111827", margin:"0 0 4px 0" }}>
          {item.title}
        </p>
        {item.authors && (
          <p style={{ fontSize:12, color:"#6b7280", margin:0 }}>
            {item.authors.map(a => a.name).join(", ")}
          </p>
        )}
        {item.abstract && (
          <p style={{ fontSize:12, color:"#6b7280", margin:"6px 0 0 0", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
            {item.abstract}
          </p>
        )}
      </div>
      {item.doi && (
        <a
          href={`https://doi.org/${item.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#1a56db",
            textDecoration:"none", fontWeight:500, flexShrink:0,
          }}
        >
          DOI <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const [params, setParams] = useState({ q: "", output_type: "", page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["research", params],
    queryFn: async () => {
      const { data } = await api.get("/research", { params });
      return data.data;
    },
    enabled: ready,
  });

  const canUpload = ready && ["researcher", "admin"].includes(user?.role ?? "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, q: searchInput, page: 1 }));
  };

  const handleView = (id: string) => {
    router.push(`/research/${id}`);
  };

  if (!ready) return null;

  const topbarSearch = (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      background:"#f9fafb", border:"1px solid #e5e7eb",
      borderRadius:8, padding:"7px 14px",
      flex:1, maxWidth:340,
    }}>
      <Search size={14} color="#9ca3af" />
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search research…"
        style={{
          border:"none", background:"transparent",
          fontSize:13, color:"#6b7280", width:"100%",
          outline:"none",
        }}
      />
    </div>
  );

  return (
    <AppLayout topbarSearch={topbarSearch}>
      <div style={{ padding:"28px 32px" }}>

          {/* Page heading */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:28, fontWeight:800, color:"#111827", margin:0, lineHeight:1.2 }}>
              Research Repository
            </h1>
            <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
              Discover faculty research, publications, and datasets
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display:"flex", gap:8, marginBottom:20 }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, author, or keyword…"
              style={{
                flex:1, padding:"10px 14px", border:"1px solid #e5e7eb",
                borderRadius:8, fontSize:13, outline:"none",
                fontFamily:"inherit",
              }}
              onFocus={(e) => e.target.style.borderColor = "#1a56db"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
            <button
              type="submit"
              style={{
                padding:"10px 20px", borderRadius:8, border:"none",
                background:"linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
              }}
            >
              Search
            </button>
            {canUpload && (
              <Link href="/research/upload" style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"10px 16px", borderRadius:8,
                background:"linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                color:"#fff", fontSize:13, fontWeight:600,
                textDecoration:"none", cursor:"pointer",
              }}>
                <Plus size={14} /> Upload
              </Link>
            )}
          </form>

          {/* Type filter chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {[
              { value: "", label: "All Types" },
              { value: "journal", label: "Journal" },
              { value: "conference", label: "Conference" },
              { value: "thesis", label: "Thesis" },
              { value: "dataset", label: "Dataset" },
              { value: "report", label: "Report" },
            ].map((t) => {
              const active = params.output_type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setParams((p) => ({ ...p, output_type: t.value, page: 1 }))}
                  style={{
                    padding:"6px 14px", borderRadius:6, border: active ? "none" : "1px solid #e5e7eb",
                    background: active ? "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)" : "#fff",
                    color: active ? "#fff" : "#6b7280",
                    fontSize:12, fontWeight: active ? 600 : 500,
                    cursor:"pointer", transition:"all 0.2s",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          {!isLoading && data && (
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>
              <span style={{ fontWeight:600, color:"#111827" }}>{data.total}</span> research output{data.total !== 1 ? "s" : ""}
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ marginBottom:12 }}>
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{
              background:"#fde8e8", border:"1px solid #fce1e1",
              borderRadius:8, padding:12, color:"#c81e1e", fontSize:13,
            }}>
              Failed to load research outputs. Please try again.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <FlaskConical size={48} color="#d1d5db" style={{ margin:"0 auto 16px" }} />
              <p style={{ fontSize:16, fontWeight:600, color:"#111827", margin:0 }}>
                No research outputs found
              </p>
              <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
                Try different search terms or clear the type filter.
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && data?.items && data.items.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {data.items.map((item: any) => (
                <ResearchCard key={item.output_id} item={item} onView={handleView} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && data?.total_pages && data.total_pages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:24 }}>
              <button
                onClick={() => setParams((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={params.page === 1}
                style={{
                  padding:"8px 12px", borderRadius:6, border:"1px solid #e5e7eb",
                  background:"#fff", color:"#6b7280", fontSize:12, cursor: params.page === 1 ? "not-allowed" : "pointer",
                  opacity: params.page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize:12, color:"#6b7280" }}>
                Page {params.page} of {data.total_pages}
              </span>
              <button
                onClick={() => setParams((p) => ({ ...p, page: Math.min(data.total_pages, p.page + 1) }))}
                disabled={params.page === data.total_pages}
                style={{
                  padding:"8px 12px", borderRadius:6, border:"1px solid #e5e7eb",
                  background:"#fff", color:"#6b7280", fontSize:12, cursor: params.page === data.total_pages ? "not-allowed" : "pointer",
                  opacity: params.page === data.total_pages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
      </div>
    </AppLayout>
  );
}
