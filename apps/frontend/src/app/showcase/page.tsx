"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Plus, GraduationCap, Users, Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

const DEPARTMENTS = ["All", "CSE", "EEE", "ME", "CE", "BBA", "English", "Physics"];

const TECH_COLORS: Record<string, string> = {
  React: "#3b82f6",
  "Node.js": "#10b981",
  Python: "#f59e0b",
  Django: "#059669",
  Flutter: "#06b6d4",
  Arduino: "#f97316",
};

function ProjectCard({ project, onClick }: {
  project: {
    project_id: string;
    title: string;
    abstract: string;
    department: string;
    semester: string;
    technologies: string[];
    team_members: Array<{ name: string }>;
  };
  onClick: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onClick(project.project_id)}
      style={{
        background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
        padding:16, cursor:"pointer", transition:"all 0.2s",
        display:"flex", flexDirection:"column", gap:12,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Thumbnail */}
      <div style={{
        height:120, borderRadius:8, background:"linear-gradient(135deg, #10b98140, #0891b240)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <GraduationCap size={36} color="#10b981" />
      </div>

      {/* Content */}
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:"#111827", margin:"0 0 4px 0", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
          {project.title}
        </p>
        <p style={{ fontSize:12, color:"#6b7280", margin:"4px 0 0 0", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
          {project.abstract}
        </p>
      </div>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {project.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              style={{
                fontSize:10, fontWeight:600, padding:"2px 8px",
                borderRadius:4, background:TECH_COLORS[tech] + "15",
                color: TECH_COLORS[tech],
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span style={{
              fontSize:10, fontWeight:600, padding:"2px 8px",
              borderRadius:4, background:"#f3f4f6", color:"#6b7280",
            }}>
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop:"1px solid #f3f4f6", paddingTop:10,
        display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#9ca3af",
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Calendar size={12} /> {project.semester}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
          <Users size={12} /> {project.team_members?.length ?? 0}
        </span>
        <span style={{ marginLeft:"auto", fontWeight:500, color:"#6b7280" }}>
          {project.department}
        </span>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  const router = useRouter();
  const { user, ready } = useAuthGuard();
  const [params, setParams] = useState({ department: "", q: "", page: 1, limit: 12 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["showcase", params],
    queryFn: async () => {
      const { data } = await api.get("/showcase", { params });
      return data.data;
    },
    enabled: ready,
  });

  const canSubmit = ready && (user?.role === "student_author" || user?.role === "admin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, q: searchInput, page: 1 }));
  };

  const handleView = (id: string) => {
    router.push(`/showcase/${id}`);
  };

  const clearFilters = () => {
    setParams({ department: "", q: "", page: 1, limit: 12 });
    setSearchInput("");
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
        placeholder="Search projects…"
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
      <div style={{ padding:"28px 32px" }} className="showcase-container">

          {/* Page heading */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2, fontFamily: "'Inter', -apple-system, sans-serif" }} className="showcase-heading">
              Student Showcase
            </h1>
            <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
              Explore projects from all departments and semesters
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display:"flex", gap:8, marginBottom:20 }} className="showcase-search-form">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search projects by title or technology…"
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
                background:"var(--theme-gradient-160)",
                color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
              }}
            >
              Search
            </button>
            {canSubmit && (
              <Link href="/showcase/submit" style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"10px 16px", borderRadius:8,
                background:"var(--theme-gradient-160)",
                color:"#fff", fontSize:13, fontWeight:600,
                textDecoration:"none", cursor:"pointer",
              }}>
                <Plus size={14} /> Submit
              </Link>
            )}
          </form>

          {/* Department filter chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {DEPARTMENTS.map((dept) => {
              const active = (dept === "All" && !params.department) || params.department === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setParams((p) => ({ ...p, department: dept === "All" ? "" : dept, page: 1 }))}
                  style={{
                    padding:"6px 14px", borderRadius:6, border: active ? "none" : "1px solid #e5e7eb",
                    background: active ? "var(--theme-gradient-160)" : "#fff",
                    color: active ? "#fff" : "#6b7280",
                    fontSize:12, fontWeight: active ? 600 : 500,
                    cursor:"pointer", transition:"all 0.2s",
                  }}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          {!isLoading && data && (
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>
              <span style={{ fontWeight:600, color:"#111827" }}>{data.total}</span> project{data.total !== 1 ? "s" : ""}
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-64 w-full" />
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
              Failed to load projects. Please try again.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <GraduationCap size={48} color="#d1d5db" style={{ margin:"0 auto 16px" }} />
              <p style={{ fontSize:16, fontWeight:600, color:"#111827", margin:0 }}>
                No projects found
              </p>
              <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>
                {params.department || params.q ? "Try adjusting your filters." : "No projects have been published yet."}
              </p>
            </div>
          )}

          {/* Results grid */}
          {!isLoading && data?.items && data.items.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16, marginBottom:24 }}>
              {data.items.map((project: any) => (
                <ProjectCard key={project.project_id} project={project} onClick={handleView} />
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
