"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ArrowRight, Users, FlaskConical, LayoutGrid,
  GraduationCap, BarChart3, Building2, X,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS } from "@/components/design/dkpTheme";
import { Skeleton } from "@/components/ui/Skeleton";

type ShowcaseProject = {
  project_id: string;
  title: string;
  abstract: string;
  department: string;
  semester: string;
  thumbnail_url?: string | null;
  technologies: string[];
  team_members: Array<{ name: string }>;
  advisor_name?: string;
};

/** Stitch discipline tabs mapped to real catalog departments. */
const DISCIPLINES = [
  { label: "All Disciplines", department: "" },
  { label: "Engineering", department: "EEE" },
  { label: "Computer Science", department: "CSE" },
  { label: "Sciences", department: "Physics" },
  { label: "Business", department: "BBA" },
] as const;

function teamLabel(project: ShowcaseProject) {
  const names = (project.team_members || []).map((m) => m.name).filter(Boolean);
  if (names.length === 0) return "Student team";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} others`;
}

function disciplineLabel(department?: string) {
  const d = (department || "").toUpperCase();
  if (d === "CSE") return "Computer Science";
  if (d === "EEE" || d === "ME" || d === "CE") return "Engineering";
  if (d === "PHYSICS" || d === "PHY") return "Sciences";
  if (d === "BBA") return "Business & Economics";
  if (d === "ENGLISH") return "Arts & Humanities";
  return department || "Showcase";
}

function PlaceholderIcon({ department }: { department?: string }) {
  const d = (department || "").toUpperCase();
  if (d === "PHYSICS" || d === "PHY") return <FlaskConical size={28} color={C.accent} />;
  if (d === "BBA") return <BarChart3 size={28} color={C.accent} />;
  if (d === "EEE" || d === "ME" || d === "CE") return <Building2 size={28} color={C.accent} />;
  return <GraduationCap size={28} color={C.accent} />;
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: ShowcaseProject;
  onOpen: (id: string) => void;
}) {
  const hasThumb = Boolean(project.thumbnail_url);

  return (
    <article
      className="dkp-coll-card"
      onClick={() => onOpen(project.project_id)}
      style={{
        background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12,
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        boxShadow: "0 4px 16px rgba(26,26,46,0.05)", minHeight: 280,
      }}
    >
      {hasThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnail_url!}
          alt=""
          style={{ width: "100%", height: 160, objectFit: "cover", display: "block", background: C.chip }}
        />
      ) : (
        <div style={{
          height: 160, background: `linear-gradient(145deg, ${C.band} 0%, ${C.chip} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: C.white,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(26,26,46,0.06)",
          }}>
            <PlaceholderIcon department={project.department} />
          </div>
        </div>
      )}

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <span style={{
          alignSelf: "flex-start", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: C.accent, background: C.chip,
          padding: "4px 10px", borderRadius: 999,
        }}>
          {disciplineLabel(project.department)}
        </span>

        <h3 style={{
          fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {project.title}
        </h3>

        <p style={{
          fontSize: 14, color: C.body, margin: 0, lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {project.abstract || "Student project from the University of Dhaka showcase."}
        </p>

        <div style={{
          marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {teamLabel(project)}
            </div>
            <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>
              {project.department}{project.semester ? ` · ${project.semester}` : ""}
            </div>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontSize: 13, fontWeight: 700, color: C.accent,
          }}>
            View <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ShowcasePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [params, setParams] = useState({ department: "", q: "", page: 1, limit: 8 });
  const [searchInput, setSearchInput] = useState("");
  const [accumulated, setAccumulated] = useState<ShowcaseProject[]>([]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["showcase", params],
    queryFn: async () => {
      const { data } = await api.get("/showcase", { params });
      return data.data as {
        items: ShowcaseProject[];
        total: number;
        page: number;
        total_pages: number;
      };
    },
  });

  useEffect(() => {
    if (!data?.items) return;
    setAccumulated((prev) => {
      if (params.page === 1) return data.items;
      const seen = new Set(prev.map((p) => p.project_id));
      return [...prev, ...data.items.filter((p) => !seen.has(p.project_id))];
    });
  }, [data, params.page]);

  const setDiscipline = (department: string) => {
    setAccumulated([]);
    setParams({ department, q: params.q, page: 1, limit: 8 });
  };

  const handleSearch = () => {
    setAccumulated([]);
    setParams((p) => ({ ...p, q: searchInput.trim(), page: 1 }));
  };
  const clearSearch = () => {
    setSearchInput("");
    setAccumulated([]);
    setParams((p) => ({ ...p, q: "", page: 1 }));
  };

  const canSubmit = isAuthenticated && user?.role === "student_author";
  const items = accumulated;

  const featured = useMemo(() => {
    if (!items.length) return null;
    return items.find((p) => p.thumbnail_url) || items[0];
  }, [items]);

  const gridItems = useMemo(() => {
    if (!featured) return items;
    const rest = items.filter((p) => p.project_id !== featured.project_id);
    return rest.length >= 4 ? rest : items;
  }, [items, featured]);

  const submitHref = canSubmit ? "/showcase/submit" : isAuthenticated ? "/showcase/submit" : "/login";

  return (
    <CollectionShell active="Showcase">
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-show-featured { grid-template-columns: 1fr !important; }
          .dkp-show-featured-img { min-height: 220px !important; height: 220px !important; }
          .dkp-show-grid { grid-template-columns: 1fr !important; }
          .dkp-show-search { width: 100% !important; }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .dkp-show-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(40px, 6vw, 72px) clamp(16px, 4vw, 64px) 0" }}>
        {/* Hero */}
        <header style={{ maxWidth: 780, marginBottom: 48 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <h1 style={{
              fontFamily: SERIF, fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 700, color: C.ink,
              margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em",
            }}>
              Student Showcase
            </h1>
            <div className="dkp-show-search" style={{ position: "relative", width: 260 }}>
              <Search size={15} color={C.body} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search projects…"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 36px",
                  border: `1px solid ${C.lineStrong}`, borderRadius: 8, background: C.white,
                  fontSize: 14, color: C.ink, outline: "none", fontFamily: SANS,
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={clearSearch}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.body, display: "flex", padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 17, color: C.body, margin: 0, lineHeight: 1.65, maxWidth: 720 }}>
            Celebrating the intellectual rigor and innovative breakthroughs of our student body.
            Explore a curated selection of exceptional projects, research papers, and creative works
            from across the university&apos;s diverse disciplines.
          </p>
        </header>

        {/* Featured */}
        {isLoading && (
          <Skeleton className="h-72 w-full rounded-xl mb-16" />
        )}

        {!isLoading && featured && (
          <section
            className="dkp-show-featured dkp-coll-card"
            style={{
              display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 0, marginBottom: 64,
              background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 14,
              overflow: "hidden", boxShadow: "0 8px 32px rgba(26,26,46,0.07)",
            }}
          >
            <div className="dkp-show-featured-img" style={{ minHeight: 340, position: "relative", background: C.band }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.thumbnail_url || "/showcase-featured.png"}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0 }}
              />
            </div>
            <div style={{ padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column" }}>
              <span style={{
                alignSelf: "flex-start", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
                textTransform: "uppercase", color: C.accent, background: C.chip,
                padding: "5px 12px", borderRadius: 999, marginBottom: 16,
              }}>
                Featured Project
              </span>
              <h2 style={{
                fontFamily: SERIF, fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 700, color: C.ink,
                margin: "0 0 14px", lineHeight: 1.25,
              }}>
                {featured.title}
              </h2>
              <p style={{
                fontSize: 15, color: C.body, margin: "0 0 20px", lineHeight: 1.6,
                display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {featured.abstract || "An outstanding student project from the University of Dhaka."}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: C.band, color: C.ink,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Users size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{teamLabel(featured)}</div>
                  <div style={{ fontSize: 13, color: C.body }}>
                    Department of {featured.department}
                    {featured.advisor_name ? ` · Advisor: ${featured.advisor_name}` : ""}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/showcase/${featured.project_id}`)}
                style={{
                  marginTop: "auto", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", color: C.ink, border: `1.5px solid ${C.ink}`,
                  padding: "11px 18px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                View Project <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* Explore */}
        <section style={{ marginBottom: 72 }}>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
            gap: 16, marginBottom: 24,
          }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.ink, margin: 0 }}>
              Explore Projects
            </h2>
            {!isLoading && data && (
              <span style={{ fontSize: 14, color: C.body }}>
                {data.total.toLocaleString()} project{data.total === 1 ? "" : "s"}
                {params.q ? ` for “${params.q}”` : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {DISCIPLINES.map((d) => {
              const active = params.department === d.department;
              return (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDiscipline(d.department)}
                  style={{
                    padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: active ? "none" : `1px solid ${C.lineStrong}`,
                    background: active ? C.ink : C.white,
                    color: active ? C.white : C.body,
                    letterSpacing: "0.02em",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="dkp-show-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
            </div>
          )}

          {isError && (
            <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
              Failed to load projects. Please try again.
            </div>
          )}

          {!isLoading && !isError && gridItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 24px", background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 12 }}>
              <LayoutGrid size={28} color={C.body} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>No projects found</p>
              <p style={{ fontSize: 14, color: C.body, margin: 0 }}>Try another discipline or clear your search.</p>
            </div>
          )}

          {!isLoading && gridItems.length > 0 && (
            <>
              <div className="dkp-show-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                {gridItems.map((project) => (
                  <ProjectCard
                    key={project.project_id}
                    project={project}
                    onOpen={(id) => router.push(`/showcase/${id}`)}
                  />
                ))}
              </div>

              {data && data.total_pages > 1 && params.page < data.total_pages && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
                  <button
                    type="button"
                    disabled={isFetching}
                    onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8, background: "transparent",
                      border: `1.5px solid ${C.ink}`, color: C.ink, padding: "12px 22px", borderRadius: 6,
                      fontSize: 14, fontWeight: 700, cursor: isFetching ? "wait" : "pointer",
                      opacity: isFetching ? 0.6 : 1,
                    }}
                  >
                    {isFetching ? "Loading…" : "Load More Projects"} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* CTA */}
      <section style={{ background: C.ink, color: C.white, padding: "clamp(48px, 7vw, 72px) clamp(16px, 4vw, 64px)", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700,
            margin: "0 0 14px", letterSpacing: "-0.01em",
          }}>
            Contribute to the Archive
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", margin: "0 0 28px", lineHeight: 1.6 }}>
            Share your course project with the university community. Student authors can submit work for advisor review and publication in the showcase.
          </p>
          <Link
            href={submitHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: C.white, color: C.ink,
              padding: "13px 26px", borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Submit Your Project
          </Link>
        </div>
      </section>
    </CollectionShell>
  );
}
