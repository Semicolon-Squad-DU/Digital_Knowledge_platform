import Link from "next/link";
import { Archive, BookOpen, GraduationCap, FlaskConical, ArrowRight, Sparkles } from "lucide-react";

const modules = [
  {
    icon: Archive,
    title: "Digital Archive",
    description: "Browse and search archived documents, media files, and institutional records in Bangla and English.",
    href: "/archive",
    count: "10,000+",
    countLabel: "documents",
    barClass: "bg-gradient-to-r from-sky-500/35 via-sky-400/20 to-transparent",
    iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    icon: FlaskConical,
    title: "Research Repository",
    description: "Discover faculty research outputs, lab portfolios, and academic publications with citation export.",
    href: "/research",
    count: "500+",
    countLabel: "papers",
    barClass: "bg-gradient-to-r from-violet-500/35 via-violet-400/20 to-transparent",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    icon: GraduationCap,
    title: "Student Showcase",
    description: "Explore student projects from all departments, filtered by semester, technology, and advisor.",
    href: "/showcase",
    count: "1,200+",
    countLabel: "projects",
    barClass: "bg-gradient-to-r from-emerald-500/35 via-emerald-400/20 to-transparent",
    iconClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  {
    icon: BookOpen,
    title: "Library Catalog",
    description: "Search the physical library catalog, check availability, borrow books, and manage your reading list.",
    href: "/library",
    count: "50,000+",
    countLabel: "books",
    barClass: "bg-gradient-to-r from-amber-500/35 via-amber-400/15 to-transparent",
    iconClass: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
  },
] as const;

const stats = [
  { value: "10,000+", label: "Archive documents" },
  { value: "500+", label: "Research papers" },
  { value: "1,200+", label: "Student projects" },
  { value: "50,000+", label: "Library books" },
  { value: "2,400+", label: "Active members" },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-border-default)]">
        <div
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="page-container relative py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-5 shadow-sm"
              style={{
                borderColor: "var(--color-border-default)",
                background: "var(--color-canvas-default)",
                color: "var(--color-fg-muted)",
              }}
            >
              <Sparkles size={14} className="text-[var(--color-accent-fg)]" aria-hidden />
              University of Dhaka · CSE
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.1]"
              style={{ color: "var(--color-fg-default)" }}
            >
              Digital Knowledge Platform
            </h1>
            <p className="mt-4 text-lg sm:text-xl font-medium max-w-2xl" style={{ color: "var(--color-fg-muted)" }}>
              One place for archives, research, student projects, and the library catalog — with search in Bangla or English.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/archive"
                className="inline-flex items-center justify-center gap-2 min-h-10 px-5 rounded-md text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fg)]"
                style={{ background: "#1f883d", boxShadow: "0 1px 0 rgba(31,35,40,0.1)" }}
              >
                Explore Archive
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center justify-center min-h-10 px-5 rounded-md text-sm font-semibold border transition-colors hover:bg-[var(--color-canvas-subtle)]"
                style={{
                  color: "var(--color-fg-default)",
                  borderColor: "var(--color-border-default)",
                  background: "var(--color-canvas-default)",
                }}
              >
                Browse Library
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — grid (no flex+divide wrap bugs) */}
      <section
        className="border-b py-10 sm:py-12"
        style={{
          borderColor: "var(--color-border-default)",
          background: "var(--color-canvas-subtle)",
        }}
      >
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border px-4 py-4 sm:py-5 text-center shadow-sm"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "var(--color-canvas-default)",
                }}
              >
                <p className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight" style={{ color: "var(--color-fg-default)" }}>
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm mt-1 leading-snug" style={{ color: "var(--color-fg-muted)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="page-container py-12 sm:py-16">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--color-fg-default)" }}>
            Explore the platform
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-fg-muted)" }}>
            Jump into a module — each area is tailored for students, faculty, and staff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative flex flex-col rounded-lg border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fg)]"
              style={{
                borderColor: "var(--color-border-default)",
                background: "var(--color-canvas-default)",
                boxShadow: "0 1px 0 rgba(31,35,40,0.04)",
              }}
            >
              <div className={`absolute inset-x-0 top-0 h-1 rounded-t-lg ${mod.barClass}`} aria-hidden />
              <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${mod.iconClass}`}>
                <mod.icon size={22} strokeWidth={1.75} aria-hidden />
              </div>

              <h3
                className="text-base font-semibold group-hover:text-[var(--color-accent-fg)] transition-colors"
                style={{ color: "var(--color-fg-default)" }}
              >
                {mod.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed flex-1 line-clamp-4" style={{ color: "var(--color-fg-muted)" }}>
                {mod.description}
              </p>

              <div
                className="flex items-center justify-between mt-5 pt-4 border-t"
                style={{ borderColor: "var(--color-border-muted)" }}
              >
                <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--color-fg-default)" }}>
                    {mod.count}
                  </span>{" "}
                  {mod.countLabel}
                </span>
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors group-hover:border-[var(--color-accent-fg)] group-hover:text-[var(--color-accent-fg)]"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-fg-muted)" }}
                >
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
