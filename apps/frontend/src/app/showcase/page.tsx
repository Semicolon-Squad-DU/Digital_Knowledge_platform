"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Search, Users, Calendar } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["All", "CSE", "EEE", "ME", "CE", "BBA", "English", "Physics"];

const TECH_COLORS: Record<string, string> = {
  React: "bg-blue-50 text-blue-700",
  "Node.js": "bg-green-50 text-green-700",
  Python: "bg-yellow-50 text-yellow-700",
  Django: "bg-emerald-50 text-emerald-700",
  Flutter: "bg-cyan-50 text-cyan-700",
  Arduino: "bg-orange-50 text-orange-700",
};

function getTechColor(tech: string) {
  return TECH_COLORS[tech] ?? "bg-slate-100 text-slate-600";
}

export default function ShowcasePage() {
  const [params, setParams] = useState({ department: "", semester: "", q: "", page: 1, limit: 12 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["showcase", params],
    queryFn: async () => {
      const { data } = await api.get("/showcase", { params });
      return data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, q: searchInput, page: 1 }));
  };

  const clearFilters = () => {
    setParams({ department: "", semester: "", q: "", page: 1, limit: 12 });
    setSearchInput("");
  };

  const hasFilters = params.department || params.q;

  return (
    <div className="page-container py-8">
      <PageHeader
        title="Student Showcase"
        subtitle="Explore projects from all departments and semesters"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Showcase" }]}
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="search-bar flex-1">
          <Search className="search-bar-icon" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects by title or technology…"
            className="form-input pl-10"
            aria-label="Search projects"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Department filter */}
      <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Filter by department">
        {DEPARTMENTS.map((dept) => {
          const active = (dept === "All" && !params.department) || params.department === dept;
          return (
            <button
              key={dept}
              onClick={() => setParams((p) => ({ ...p, department: dept === "All" ? "" : dept, page: 1 }))}
              className={cn("filter-chip", active && "filter-chip-active")}
              aria-pressed={active}
            >
              {dept}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4 min-h-[1.5rem]">
        {!isLoading && data && (
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{data.total}</span> projects
          </p>
        )}
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      </div>

      {isError && <div className="alert alert-danger mb-4" role="alert">Failed to load projects.</div>}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && !isError && data?.items?.length === 0 && (
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="No projects found"
          description={hasFilters ? "Try adjusting your filters." : "No projects have been published yet."}
          action={hasFilters ? { label: "Clear filters", onClick: clearFilters, variant: "outline" } : undefined}
        />
      )}

      {!isLoading && data?.items && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((project: {
              project_id: string;
              title: string;
              abstract: string;
              department: string;
              semester: string;
              technologies: string[];
              advisor_name: string;
              team_members: Array<{ name: string }>;
            }) => (
              <Link
                key={project.project_id}
                href={`/showcase/${project.project_id}`}
                className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-900/8 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="h-36 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: "radial-gradient(circle at 30% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 70% 50%, #0891b2 0%, transparent 50%)",
                    }}
                  />
                  <GraduationCap size={36} className="text-emerald-600 relative z-10 opacity-60" />
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 line-clamp-2 transition-colors leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {project.abstract}
                  </p>

                  {/* Tech tags */}
                  {project.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${getTechColor(tech)}`}
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {project.semester}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {project.team_members?.length ?? 0} members
                    </span>
                    <span className="ml-auto font-medium text-slate-500">{project.department}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              page={params.page}
              totalPages={data.total_pages}
              total={data.total}
              limit={params.limit}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
