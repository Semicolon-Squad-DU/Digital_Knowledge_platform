import Link from "next/link";
import { Archive, BookOpen, GraduationCap, FlaskConical, ArrowRight } from "lucide-react";

const modules = [
  {
    icon: Archive,
    title: "Digital Archive",
    description: "Browse and search archived documents, media files, and institutional records in Bangla and English.",
    href: "/archive",
    count: "10,000+",
    countLabel: "documents",
  },
  {
    icon: FlaskConical,
    title: "Research Repository",
    description: "Discover faculty research outputs, lab portfolios, and academic publications with citation export.",
    href: "/research",
    count: "500+",
    countLabel: "papers",
  },
  {
    icon: GraduationCap,
    title: "Student Showcase",
    description: "Explore student projects from all departments, filtered by semester, technology, and advisor.",
    href: "/showcase",
    count: "1,200+",
    countLabel: "projects",
  },
  {
    icon: BookOpen,
    title: "Library Catalog",
    description: "Search the physical library catalog, check availability, borrow books, and manage your reading list.",
    href: "/library",
    count: "50,000+",
    countLabel: "books",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero — GitHub-style muted banner */}
      <div style={{ background: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border-default)" }}>
        <div className="page-container py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--color-fg-default)" }}>
              Digital Knowledge Platform
            </h1>
            <p className="mt-3 text-base" style={{ color: "var(--color-fg-muted)" }}>
              University of Dhaka · Department of Computer Science &amp; Engineering
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>
              One platform for all institutional knowledge — archives, research, student projects, and library catalog. Search in Bangla or English.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium text-white border border-transparent transition-colors"
                style={{ background: "#1f883d", borderColor: "rgba(31,35,40,0.15)" }}
              >
                Explore Archive
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium border transition-colors hover:bg-[var(--color-canvas-inset)]"
                style={{ color: "var(--color-fg-default)", borderColor: "var(--color-border-default)", background: "var(--color-canvas-default)" }}
              >
                Browse Library
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderBottom: "1px solid var(--color-border-default)" }}>
        <div className="page-container">
          <div className="flex flex-wrap divide-x" style={{ divideColor: "var(--color-border-default)" }}>
            {[
              { value: "10,000+", label: "Archive documents" },
              { value: "500+",    label: "Research papers" },
              { value: "1,200+", label: "Student projects" },
              { value: "50,000+",label: "Library books" },
              { value: "2,400+", label: "Active members" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-4 first:pl-0">
                <span className="text-base font-semibold" style={{ color: "var(--color-fg-default)" }}>{s.value}</span>
                <span className="text-sm ml-1.5" style={{ color: "var(--color-fg-muted)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div className="page-container py-8">
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-fg-default)" }}>
          Explore the Platform
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group gh-box p-4 hover:border-[var(--color-accent-fg)] transition-colors duration-100 block"
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
                style={{ background: "var(--color-canvas-subtle)", border: "1px solid var(--color-border-default)", color: "var(--color-fg-muted)" }}
              >
                <mod.icon size={16} />
              </div>

              <h3 className="text-sm font-semibold mb-1 group-hover:text-[var(--color-accent-fg)] transition-colors" style={{ color: "var(--color-fg-default)" }}>
                {mod.title}
              </h3>
              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--color-fg-muted)" }}>
                {mod.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border-muted)" }}>
                <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--color-fg-default)" }}>{mod.count}</span>
                  {" "}{mod.countLabel}
                </span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--color-fg-muted)" }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
