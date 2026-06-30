"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, GraduationCap, Users, Calendar, Send, FileText, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";

const DEPARTMENTS = ["CSE", "EEE", "ME", "CE", "BBA", "English", "Physics"];

const TECH_COLORS: Record<string, string> = {
  React:      "#3b82f6",
  "Node.js":  "#10b981",
  Python:     "#f59e0b",
  Django:     "#059669",
  Flutter:    "#06b6d4",
  Arduino:    "#f97316",
};

function ProjectCard({ project, onClick }: {
  project: {
    project_id: string; title: string; abstract: string;
    department: string; semester: string;
    technologies: string[]; team_members: Array<{ name: string }>;
  };
  onClick: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onClick(project.project_id)}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
        padding: 0, cursor: "pointer", transition: "all 0.18s",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "#d1d5db"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 110, background: "linear-gradient(135deg, color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff) 0%, color-mix(in srgb, var(--avatar-theme-color, #6366f1) 6%, #f8f9ff) 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid #f0f0f8",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 15%, #fff)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap size={24} color="var(--avatar-theme-color, #6366f1)" />
        </div>
      </div>

      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{
          fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
        }}>
          {project.title}
        </p>
        <p style={{
          fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
        }}>
          {project.abstract}
        </p>

        {/* Tech tags */}
        {project.technologies?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {project.technologies.slice(0, 3).map(tech => (
              <span key={tech} style={{
                fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                background: (TECH_COLORS[tech] ?? "#6b7280") + "18",
                color: TECH_COLORS[tech] ?? "#6b7280",
              }}>
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#f3f4f6", color: "#9ca3af" }}>
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #f3f4f6", paddingTop: 10, marginTop: "auto",
          display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#9ca3af",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={11} /> {project.semester}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Users size={11} /> {project.team_members?.length ?? 0}
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 700,
            color: "var(--avatar-theme-color, #6366f1)",
            background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)",
            padding: "2px 8px", borderRadius: 4,
          }}>
            {project.department}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [params, setParams]           = useState({ department: "", q: "", page: 1, limit: 12 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["showcase", params],
    queryFn: async () => {
      const { data } = await api.get("/showcase", { params });
      return data.data;
    },
  });

  const isMobile  = useMediaQuery("(max-width: 767px)");
  const canSubmit = isAuthenticated && (user?.role === "student_author" || user?.role === "admin");

  const handleSearch = () => setParams(p => ({ ...p, q: searchInput, page: 1 }));
  const clearSearch  = () => { setSearchInput(""); setParams(p => ({ ...p, q: "", page: 1 })); };
  const clearAll     = () => { setSearchInput(""); setParams({ department: "", q: "", page: 1, limit: 12 }); };

  const hasFilters = !!(params.department || params.q);

  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button" onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 12.5,
        fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
        border: active ? "1.5px solid color-mix(in srgb, var(--avatar-theme-color, #6366f1) 35%, transparent)" : "1px solid #e5e7eb",
        background: active ? "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 10%, #fff)" : "#fff",
        color: active ? "var(--avatar-theme-color, #4f46e5)" : "#6b7280",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#374151"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; } }}
    >
      {label}
    </button>
  );

  return (
    <AppLayout topbarSearch={<div />}>
      <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 60%, #eef1ff 100%)",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "28px 18px 26px" : "36px 40px 34px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Send size={17} color="var(--avatar-theme-color, #6366f1)" />
                </div>
                <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.03em" }}>
                  Showcase
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                Explore student projects from all departments &amp; semesters
              </p>
            </div>

            {canSubmit && (
              <Link
                href="/showcase/submit"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 9,
                  background: "var(--avatar-theme-color, #1a1a2e)", border: "none",
                  fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "opacity 0.2s", flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} /> Submit Project
              </Link>
            )}
          </div>

          {/* Integrated search */}
          <div style={{
            display: "flex", alignItems: "center", background: "#fff",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1.5px solid #dde2ff",
          }}>
            <Search size={16} color="#9ca3af" style={{ marginLeft: 16, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search projects by title or technology…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "13px 12px", color: "#1f2937", background: "transparent" }}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", color: "#9ca3af", display: "flex" }}>
                <X size={15} />
              </button>
            )}
            <button
              onClick={handleSearch}
              style={{
                margin: 5, padding: "9px 20px", background: "var(--avatar-theme-color, #1a1a2e)",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: isMobile ? "18px 16px" : "24px 40px" }}>

          {/* Department filter pills */}
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: "14px 16px", marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                Dept
              </span>
              <Pill label="All" active={!params.department} onClick={() => setParams(p => ({ ...p, department: "", page: 1 }))} />
              {DEPARTMENTS.map(dept => (
                <Pill key={dept} label={dept} active={params.department === dept} onClick={() => setParams(p => ({ ...p, department: dept, page: 1 }))} />
              ))}
              {hasFilters && (
                <button
                  type="button" onClick={clearAll}
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20,
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          {!isLoading && data && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <FileText size={13} color="#9ca3af" />
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>{data.total}</strong>{" "}
                project{data.total !== 1 ? "s" : ""} found
                {params.q && <span style={{ color: "#9ca3af" }}> for &ldquo;{params.q}&rdquo;</span>}
              </span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ padding: "16px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#991b1b", fontSize: 13 }}>
              Failed to load projects. Please try again.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <GraduationCap size={26} color="#9ca3af" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>No projects found</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {hasFilters ? "Try adjusting your filters or search terms." : "No projects have been published yet."}
              </p>
              {hasFilters && (
                <button type="button" onClick={clearAll} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && data?.items && data.items.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))",
                gap: 16, marginBottom: 28,
              }}>
                {data.items.map((project: any) => (
                  <ProjectCard key={project.project_id} project={project} onClick={id => router.push(`/showcase/${id}`)} />
                ))}
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 16 }}>
                  <button
                    onClick={() => setParams(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={params.page === 1}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: params.page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: params.page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} color="#6b7280" />
                  </button>
                  <span style={{ fontSize: 13, color: "#6b7280", padding: "0 8px" }}>
                    Page {params.page} of {data.total_pages}
                  </span>
                  <button
                    onClick={() => setParams(p => ({ ...p, page: Math.min(data.total_pages, p.page + 1) }))}
                    disabled={params.page === data.total_pages}
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: params.page === data.total_pages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: params.page === data.total_pages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} color="#6b7280" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
