import Link from "next/link";
import { cn } from "@/lib/utils";

const heatmapColumns = [
  [0, 1, 0, 3, 0, 0, 2],
  [2, 0, 0, 1, 4, 0, 1],
  [0, 0, 3, 2, 0, 1, 0],
  [4, 2, 1, 0, 0, 3, 2],
  [1, 0, 0, 2, 3, 1, 0],
  [0, 1, 0, 0, 2, 0, 4],
  [3, 0, 1, 2, 0, 0, 1],
  [0, 2, 4, 1, 0, 3, 0],
  [1, 0, 0, 1, 2, 0, 1],
  [0, 0, 3, 0, 0, 1, 0],
  [4, 2, 1, 0, 0, 3, 2],
  [0, 1, 0, 0, 2, 0, 4],
  [3, 0, 1, 2, 0, 0, 1],
  [0, 2, 4, 1, 0, 3, 0],
] as const;

const heatmapClass = (n: number) => {
  const map = [
    "bg-surface-variant border border-outline-variant/50",
    "bg-inverse-primary",
    "bg-primary-container",
    "bg-primary",
    "bg-primary-fixed",
  ] as const;
  return map[Math.min(n, 4)] ?? map[0];
};

const commits = [
  {
    hash: "c8f9a2",
    ago: "2h ago",
    body: "Merged pull request #442 from theory-group: \"Update quantum entanglement models\"",
    user: "Dr. A. Vance",
    tone: "primary" as const,
  },
  {
    hash: "a1b2c3",
    ago: "5h ago",
    body: "Resolved schema conflicts in legacy bio-archive database migration.",
    user: "System Auto",
    tone: "tertiary" as const,
  },
  {
    hash: "f5e4d3",
    ago: "1d ago",
    body: "Drafted initial findings on sociological impacts of automated grading systems.",
    user: "",
    tone: "outline" as const,
    tags: ["draft", "sociology"],
  },
  {
    hash: "b9x8y7",
    ago: "2d ago",
    body: "Build failed: missing dependencies in compiling interactive visualizer module.",
    user: "",
    tone: "error" as const,
  },
] as const;

export default function HomePage() {
  return (
    <div className="bg-background">
      <div className="page-container py-8 lg:py-10 space-y-12">
        {/* Welcome */}
        <section className="relative rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            aria-hidden
            style={{
              backgroundImage: `
                radial-gradient(ellipse 90% 70% at 85% 10%, rgba(167, 139, 250, 0.14), transparent 55%),
                radial-gradient(ellipse 60% 50% at 10% 90%, rgba(52, 211, 153, 0.08), transparent 50%),
                linear-gradient(to right, rgb(39 39 42 / 0.45) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(39 39 42 / 0.45) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 100% 100%, 28px 28px, 28px 28px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest/40 via-transparent to-transparent pointer-events-none" aria-hidden />
          <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-primary/90 mb-4">
                Digital Knowledge Platform
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight text-on-surface mb-5 leading-[1.08]">
                Archives, research, and the library—
                <span className="block mt-1 text-primary italic font-medium"> one calm surface.</span>
              </h1>
              <p className="text-on-surface-variant text-base sm:text-lg max-w-xl leading-relaxed">
                Search bilingual metadata, browse versioned documents, follow citations, and move from discovery to borrowing without leaving the vault.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  href="/archive"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-[3px_3px_0_0_#27272a] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#27272a] transition-transform"
                >
                  Browse archive
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm font-semibold hover:border-primary/50 hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-on-surface-variant">menu_book</span>
                  Library catalog
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-fixed px-2 py-2"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  Search everything
                </Link>
              </div>
            </div>
            <div className="hidden xl:flex w-48 h-48 rounded-full border-2 border-outline-variant bg-surface shrink-0 items-center justify-center relative overflow-hidden shadow-[6px_6px_0_0_#27272a]" aria-hidden>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/35 via-surface-container-high to-tertiary/25 blur-px" />
              <span className="material-symbols-outlined text-6xl text-on-surface/20 relative z-10">hub</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
          <div className="xl:col-span-2 space-y-10">
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              <Link
                href="/archive"
                className="group gumroad-card relative bg-surface-container p-6 md:p-8 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-4xl text-primary mb-4 block">inventory_2</span>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-2 tracking-tight">Digital archive</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Bilingual metadata, access tiers, and version history for institutional documents.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Open archive
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </span>
              </Link>

              <Link
                href="/research"
                className="group gumroad-card relative bg-surface-container p-6 md:p-8 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
              >
                <span className="material-symbols-outlined text-4xl text-tertiary mb-4 block">biotech</span>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-2 tracking-tight">Research repository</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Outputs, labs, and one-click citations (APA, MLA, BibTeX) for every record.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface group-hover:text-tertiary transition-colors">
                  Explore research
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </span>
              </Link>

              <Link
                href="/library"
                className="group gumroad-card relative bg-surface-container p-6 md:p-8 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-fixed"
              >
                <span className="material-symbols-outlined text-4xl text-primary-fixed mb-4 block">local_library</span>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-2 tracking-tight">Library catalog</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Faceted search, availability, holds, and borrowing—aligned with the public portal workflow.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface group-hover:text-primary-fixed transition-colors">
                  Browse stacks
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </span>
              </Link>

              <Link
                href="/showcase"
                className="group gumroad-card relative bg-surface-container p-6 md:p-8 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
              >
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 block">school</span>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-2 tracking-tight">Project showcase</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Student projects, advisors, and artifacts in a gallery tuned for reviewers and visitors.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface group-hover:text-on-surface-variant transition-colors">
                  View projects
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </span>
              </Link>
            </section>

            <section className="bg-surface-container border border-outline-variant rounded-xl p-5 md:p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h3 className="font-display text-lg font-bold text-on-surface tracking-tight">Global knowledge contributions</h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="heatmap-cell bg-surface-variant border border-outline-variant/50" />
                    <div className="heatmap-cell bg-inverse-primary" />
                    <div className="heatmap-cell bg-primary-container" />
                    <div className="heatmap-cell bg-primary" />
                    <div className="heatmap-cell bg-primary-fixed" />
                  </div>
                  <span>More</span>
                </div>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-1 min-w-[520px]">
                  {heatmapColumns.map((col, ci) => (
                    <div key={ci} className="flex flex-col gap-1">
                      {col.map((cell, ri) => (
                        <div key={ri} className={`heatmap-cell ${heatmapClass(cell)}`} title="Activity" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-on-surface-variant flex flex-wrap justify-between gap-2">
                <span>1,204 contributions in the last year</span>
                <span className="text-on-surface-variant/80">Powered by DKP Core</span>
              </div>
            </section>
          </div>

          <aside className="xl:col-span-1">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 xl:sticky xl:top-24">
              <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-5">
                <h3 className="font-display text-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Showcase
                </h3>
                <Link href="/dashboard" className="text-xs text-primary hover:text-primary-fixed uppercase tracking-widest font-bold">
                  View all
                </Link>
              </div>
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-outline-variant">
                {commits.map((c) => (
                  <div key={c.hash} className="relative flex items-start gap-3">
                    <div
                      className={cnRing(c.tone)}
                    >
                      {c.tone === "primary" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      {c.tone === "tertiary" && (
                        <span className="material-symbols-outlined text-[10px] text-tertiary leading-none">check</span>
                      )}
                      {c.tone === "outline" && <span className="block w-2 h-2 rounded-full bg-outline-variant" />}
                      {c.tone === "error" && (
                        <span className="material-symbols-outlined text-[10px] text-error leading-none">close</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 border p-3 rounded-lg text-left min-w-0",
                        c.tone === "error"
                          ? "bg-error-container/20 border-error/30"
                          : "bg-surface-container border-outline-variant hover:border-primary/40 transition-colors"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={cn("text-sm font-bold font-mono", c.tone === "error" ? "text-error" : "text-on-surface")}>
                          {c.hash}
                        </span>
                        <span
                          className={cn(
                            "text-xs shrink-0",
                            c.tone === "error" ? "text-error/70" : "text-on-surface-variant"
                          )}
                        >
                          {c.ago}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm line-clamp-2",
                          c.tone === "error" ? "text-error/90" : "text-on-surface-variant"
                        )}
                      >
                        {c.body}
                      </p>
                      {"tags" in c && c.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-surface-variant text-[10px] text-on-surface border border-outline-variant"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {c.user ? (
                        <p className="mt-2 text-xs text-on-surface">{c.user}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function cnRing(tone: "primary" | "tertiary" | "outline" | "error") {
  const base =
    "w-6 h-6 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-2 bg-surface-container";
  if (tone === "primary") return `${base} border-primary`;
  if (tone === "tertiary") return `${base} border-tertiary`;
  if (tone === "error") return `${base} border-error`;
  return `${base} border-outline-variant bg-surface`;
}
