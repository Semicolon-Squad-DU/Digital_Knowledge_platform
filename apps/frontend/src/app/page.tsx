"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import {
  Archive, BookOpen, FlaskConical, LayoutGrid, Library, Search,
  ArrowRight, ArrowDown, ChevronRight, LogOut, LayoutDashboard, Menu, X,
} from "lucide-react";

// ── Institutional palette (from the Stitch "Semicolon Website Redesign") ──
const C = {
  ink:        "#1A1A2E", // university-blue
  accent:     "#0D47A1", // institutional-accent
  bg:         "#f9f9ff", // background
  band:       "#e1e8fd", // surface-container-high (soft lavender)
  chip:       "#f1f3ff", // surface-container-low (icon chip)
  white:      "#ffffff",
  body:       "#555f6d", // secondary text
  line:       "rgba(75,85,99,0.16)",
  lineStrong: "rgba(75,85,99,0.22)",
  connector:  "#dce2f7", // surface-variant
};
const SERIF = "var(--font-serif), 'Libre Caslon Text', Georgia, serif";
const SANS  = "var(--font-hanken), 'Hanken Grotesk', system-ui, sans-serif";

const NAV_LINKS = [
  { label: "Archive",  href: "/archive"  },
  { label: "Library",  href: "/library"  },
  { label: "Research", href: "/research" },
  { label: "Showcase", href: "/showcase" },
];

const COLLECTIONS = [
  { icon: Archive,      title: "Archive",  href: "/archive",  cta: "Browse Archive",            desc: "Search institutional documents and administrative memory." },
  { icon: BookOpen,     title: "Library",  href: "/library",  cta: "Browse Library Catalog",    desc: "Books, journals, and comprehensive academic literature." },
  { icon: FlaskConical, title: "Research", href: "/research", cta: "Browse Research Repository", desc: "Faculty publications, datasets, and ongoing studies." },
  { icon: LayoutGrid,   title: "Showcase", href: "/showcase", cta: "Browse Showcase Gallery",   desc: "Student project highlights and featured academic achievements." },
];

const ROLES = [
  { title: "Members",         desc: "Borrow books, place holds, and build a personal reading wishlist from the full catalog." },
  { title: "Student Authors", desc: "Publish course projects to the university showcase with advisor review and feedback." },
  { title: "Researchers",     desc: "Submit publications and datasets with DOIs, citations, and lab affiliations." },
  { title: "Archivists",      desc: "Preserve institutional documents with versioning and tiered access control." },
  { title: "Librarians",      desc: "Issue and return books, manage fines, and keep the lending catalog moving." },
  { title: "Administrators",  desc: "Approve accounts, audit every sensitive action, and configure the platform." },
];

const STEPS = [
  { n: "01", title: "Register",   desc: "Sign up with your institutional university email address." },
  { n: "02", title: "Verify",     desc: "Enter the 6-digit code we send to your inbox to activate your account." },
  { n: "03", title: "Contribute", desc: "Land in a workspace built for your role and start exploring." },
];

const FACULTIES = [
  { name: "CSE",  full: "Computer Science & Engineering" },
  { name: "EEE",  full: "Electrical & Electronic Engineering" },
  { name: "IIT",  full: "Institute of Information Technology" },
  { name: "RME",  full: "Robotics & Mechatronics Engineering" },
  { name: "GEB",  full: "Genetic Engineering & Biotechnology" },
  { name: "PHR",  full: "Pharmacy" },
  { name: "NE",   full: "Nuclear Engineering" },
  { name: "ACCE", full: "Applied Chemistry & Chemical Eng." },
];

// Count up once, when scrolled into view
function CountUp({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true; obs.disconnect();
      const t0 = performance.now(), dur = 1400;
      const tick = (t: number) => {
        const p = Math.min((t - t0) / dur, 1);
        setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
<<<<<<< Updated upstream
  return <span ref={ref}>{value === null ? "—" : display.toLocaleString()}</span>;
=======

  return <span ref={ref}>{value === null ? "0" : display.toLocaleString()}</span>;
>>>>>>> Stashed changes
}

// Fade-up on scroll (transform/opacity only; reduced-motion safe via CSS)
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`dkp-reveal${visible ? " is-visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<{ archive: number | null; research: number | null; catalog: number | null; showcase: number | null }>({
    archive: null, research: null, catalog: null, showcase: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, r, c, s] = await Promise.allSettled([
        api.get("/archive/search", { params: { limit: 1 } }),
        api.get("/research", { params: { limit: 1 } }),
        api.get("/library/catalog/search", { params: { limit: 1 } }),
        api.get("/showcase", { params: { limit: 1 } }),
      ]);
      if (cancelled) return;
      const tot = (x: PromiseSettledResult<any>) =>
        x.status === "fulfilled" ? (x.value.data.data.total ?? x.value.data.data.items?.length ?? null) : null;
      setStats({ archive: tot(a), research: tot(r), catalog: tot(c), showcase: tot(s) });
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => { await logout(); router.push("/"); };

  const STAT_ITEMS = [
    { label: "Archive Documents", value: stats.archive },
    { label: "Research Outputs",  value: stats.research },
    { label: "Books in Catalog",  value: stats.catalog },
    { label: "Student Projects",  value: stats.showcase },
  ];

  const sectionLabel = (text: string) => (
    <span style={{ fontFamily: SANS, display: "block", fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent, marginBottom: 10 }}>{text}</span>
  );
  const h2 = (text: string) => (
    <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.6vw, 32px)", fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{text}</h2>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dkp-reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1); }
        .dkp-reveal.is-visible { opacity: 1; transform: none; }
        .dkp-card { transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s ease, border-color .28s ease; }
        .dkp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(26,26,46,0.08); }
        .dkp-arrow { transition: transform .2s ease; }
        .dkp-card:hover .dkp-arrow, .dkp-collink:hover .dkp-arrow { transform: translateX(4px); }
        .dkp-collink:hover { text-decoration: underline; }
        .dkp-fac:hover { border-color: rgba(13,71,161,0.5) !important; }
        .dkp-navlink:hover { color: ${C.accent} !important; }
        .dkp-btn-ink { transition: background .2s ease; }
        .dkp-btn-ink:hover { background: ${C.accent} !important; }
        @keyframes dkpBounce { 0%,100%{ transform: translate(-50%, 0); } 50%{ transform: translate(-50%, 8px); } }
        .dkp-scroll { animation: dkpBounce 1.8s ease-in-out infinite; }
        @media (max-width: 900px) {
          .dkp-hero-grid { grid-template-columns: 1fr !important; }
          .dkp-hero-img { display: none !important; }
          .dkp-nav-links { display: none !important; }
          .dkp-nav-hamburger { display: inline-flex !important; }
          .dkp-steps-line { display: none !important; }
        }
        @media (max-width: 640px) {
          .dkp-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .dkp-grid-3 { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
<<<<<<< Updated upstream
          .dkp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .dkp-card, .dkp-arrow { transition: none !important; }
          .dkp-scroll { animation: none !important; }
=======
          .home-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .home-card-lift, .home-latest-row, .home-card-icon, .home-cta-arrow { transition: none !important; }
          .home-step-icon { animation: none !important; }
        }
        @media (max-width: 768px) {
          /* ── Mobile-only layout pass ──────────────────────────────────────
             Desktop grid/box rules are untouched (they live outside this
             query). On a phone the 2/3/4-column grids from desktop cramped
             every card down to a tiny tile, so every collection below moves
             to a single, wider column with bigger padding/radius/gap. */
          .home-partner-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
          .home-partner-item {
            padding: 12px 6px !important;
            border-radius: 10px !important;
            align-items: center !important;
            justify-content: center !important;
          }
          /* Brand column stays full-width on its own row; Legal + Team sit
             side by side below it instead of stacking into one long,
             sparse vertical list. */
          .home-footer {
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas: "brand brand" "legal team" !important;
            row-gap: 22px !important;
            column-gap: 20px !important;
          }
          .home-footer > div:nth-child(1) { grid-area: brand; }
          .home-footer > div:nth-child(2) { grid-area: legal; }
          .home-footer > div:nth-child(3) { grid-area: team; }
          .home-footer p { margin-bottom: 10px !important; }
          .home-footer > div:nth-child(1) > div:first-child { margin-bottom: 8px !important; }
          .home-footer-legal-links { gap: 7px !important; }
          .home-footer-body { padding: 20px 24px 16px !important; }
          .home-footer-desc { line-height: 1.55 !important; margin-bottom: 12px !important; }
          .footer-header-text { font-size: 13.5px !important; }
          .footer-link-text { font-size: 13.5px !important; }
          /* 4 stats as a fixed 2x2 grid (not a single stacked column) with the
             number/label roughly half their desktop size — the clamp() min of
             44px was still rendering huge on a narrow phone. Heading margin
             and grid gap are also tightened so the whole "Platform in
             Numbers" block takes up noticeably less vertical space. */
          .home-stats-heading { margin-bottom: 22px !important; }
          .home-stats-heading h2 { font-size: 24px !important; }
          .home-explore-heading { margin-bottom: 22px !important; }
          .home-explore-heading h2 { font-size: 24px !important; }
          .home-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px 0 !important; }
          .home-stat-cell { padding: 4px 10px !important; }
          .home-stat-value { font-size: 26px !important; margin-bottom: 4px !important; }
          .home-stat-label { font-size: 10px !important; letter-spacing: 0.06em !important; }
          .home-stats-grid > div:nth-child(2n+1) { border-left: none !important; }
          .home-stats-grid > div:nth-child(2n) { border-left: 1px solid rgba(79, 70, 229, 0.14) !important; }
          .home-stats-grid > div:nth-child(1), .home-stats-grid > div:nth-child(2) { border-top: none !important; }
          .home-stats-grid > div:nth-child(3), .home-stats-grid > div:nth-child(4) { border-top: 1px solid rgba(79, 70, 229, 0.14) !important; padding-top: 12px !important; }
          /* 4 explore cards as a 2x2 grid (2 rows) instead of one long
             stacked column. Padding/icon/text overrides for this card live
             further below, after the generic .home-card-lift/.home-card-icon
             rules, so they win the cascade instead of being overridden by
             those broader selectors. */
          .home-explore-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .home-role-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .home-latest-grid { grid-template-columns: 1fr !important; }

          /* "Three Steps to Join": keep all 3 step icons in a single row
             (not stacked) — shrink the icon, numeral, and copy so all three
             columns fit side by side on a narrow phone. */
          .home-steps-grid { gap: 6px !important; }
          .home-step-cell { padding: 8px 4px !important; }
          .home-step-number { font-size: 34px !important; margin-bottom: -24px !important; }
          .home-step-icon { width: 34px !important; height: 34px !important; border-radius: 10px !important; margin-bottom: 10px !important; }
          .home-step-icon svg { width: 15px !important; height: 15px !important; }
          .home-step-title { font-size: 12.5px !important; margin-bottom: 4px !important; }
          .home-step-desc { font-size: 10.5px !important; line-height: 1.4 !important; }
          .home-getting-started-section { padding: 32px 24px !important; }
          .home-getting-started-heading { margin-bottom: 20px !important; }
          .home-getting-started-heading h2 { font-size: 22px !important; }

          /* Role cards (Members, Student Authors, ...): instead of one full
             role per row, make them a horizontally scrollable strip of
             Explore-card-sized tiles, swipeable left-to-right, all 6/7
             visible by scrolling rather than stacked in a tall column. */
          .home-roles-grid {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            gap: 12px !important;
            padding-bottom: 6px !important;
            margin: 0 -24px !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
            scroll-snap-type: x proximity !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .home-roles-grid > * {
            flex: 0 0 auto !important;
            width: 168px !important;
            scroll-snap-align: start !important;
          }
          .home-roles-grid .home-role-card {
            padding: 18px 14px !important;
            gap: 10px !important;
            border-radius: 16px !important;
            height: 100% !important;
          }
          /* Icon uses the site's avatar theme color (black-ish navy) instead
             of the flat #0d0d12 it had on desktop. */
          .home-roles-grid .home-role-icon {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
            background: var(--avatar-theme-color, #1a1a2e) !important;
          }
          /* Icon + title were a side-by-side row sized for a full-width
             desktop card; in a narrow 168px tile that squeezed the title
             against the icon and let it wrap oddly. Stack the icon above
             the title instead, same layout as the Explore cards. */
          .home-roles-grid .home-role-card > div:first-child {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .home-roles-grid .home-role-card p:first-of-type,
          .home-roles-grid .home-role-card > div p {
            font-size: 13.5px !important;
          }
          .home-roles-grid .home-role-card p:last-child {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
          }

          .home-card-lift, .home-role-card {
            padding: 26px 22px !important;
            border-radius: 20px !important;
          }
          .home-card-icon, .home-role-icon {
            width: 52px !important;
            height: 52px !important;
            border-radius: 15px !important;
          }

          /* Explore cards specifically get a tighter, 2-column-friendly size
             — smaller padding/icon/text than the generic card rule above so
             the copy still fits comfortably in a narrower box. */
          .home-explore-card {
            padding: 18px 14px !important;
            gap: 10px !important;
            border-radius: 16px !important;
          }
          .home-explore-card .home-card-icon {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
          }
          .home-explore-card p:first-of-type { font-size: 13.5px !important; margin-bottom: 3px !important; }
          .home-explore-card p:last-of-type { font-size: 11.5px !important; line-height: 1.4 !important; }
          .home-latest-row {
            padding: 14px 16px !important;
            border-radius: 14px !important;
            gap: 12px !important;
          }

          /* Mobile-only indigo accent pass. The plain white/#fafaf8 sections
             read as flat and bland on a phone where there's no side-by-side
             section contrast to break it up, so alternate a soft indigo tint
             into every other section and give flat role cards a colored edge
             instead of a hairline. */
          .home-stats-section {
            background: linear-gradient(180deg, #eef1ff 0%, #ffffff 55%) !important;
            padding: 36px 24px !important;
          }
          .home-explore-section {
            background: linear-gradient(180deg, #f5f6ff 0%, #fafaf8 60%) !important;
            padding: 32px 24px !important;
          }
          .home-roles-section {
            background: linear-gradient(180deg, #ffffff 0%, #f4f6ff 100%) !important;
            padding: 36px 24px !important;
          }
          .home-role-card {
            background: linear-gradient(160deg, #ffffff 0%, #f1f3ff 100%) !important;
            border: 1px solid rgba(79, 70, 229, 0.16) !important;
            box-shadow: 0 4px 14px rgba(67, 56, 202, 0.07) !important;
          }
          .home-role-icon {
            background: linear-gradient(160deg, #4338ca 0%, #1a1a2e 100%) !important;
          }
          .home-latest-row {
            border-color: rgba(79, 70, 229, 0.14) !important;
            box-shadow: 0 2px 8px rgba(67, 56, 202, 0.05) !important;
          }
          .home-latest-icon {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
            background: var(--avatar-theme-color, #1a1a2e) !important;
          }
          .home-latest-icon svg {
            stroke: #ffffff !important;
          }

          /* "Fresh From the Platform": same compact section padding and
             shrunk heading as the stats/explore/roles sections above, plus
             the two research/archive columns stack full-width instead of
             sitting side by side (each item's title/date was being crushed
             into a 2-column half-width row). */
          .home-latest-section {
            background: linear-gradient(180deg, #f5f6ff 0%, #fafaf8 60%) !important;
            padding: 32px 24px !important;
          }
          .home-latest-heading { margin-bottom: 20px !important; }
          .home-latest-heading h2 { font-size: 22px !important; }
          .home-latest-grid { row-gap: 26px !important; }
          .home-latest-col-header { margin-bottom: 12px !important; }
          .home-latest-col-header p { font-size: 13.5px !important; }
          .home-latest-viewall {
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
        }
        @media (max-width: 480px) {
          .home-footer { grid-template-columns: 1fr !important; }
>>>>>>> Stashed changes
        }
      `}} />

      <div style={{ fontFamily: SANS, background: C.bg, color: C.ink, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── NAV ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: C.white, borderBottom: `1px solid ${C.lineStrong}`, boxShadow: "0 1px 3px rgba(26,26,46,0.04)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", height: 72, padding: "0 clamp(16px, 4vw, 64px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.ink }}>
              <Library size={24} color={C.ink} />
              <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>DU Digital Knowledge Platform</span>
            </Link>

            <div className="dkp-nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="dkp-navlink" style={{ fontSize: 16, color: C.body, textDecoration: "none", transition: "color .2s" }}>{l.label}</Link>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/search" aria-label="Search" style={{ color: C.ink, padding: 8, display: "inline-flex" }}><Search size={20} /></Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="dkp-btn-ink dkp-nav-links" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ink, color: C.white, fontSize: 14, fontWeight: 600, letterSpacing: "0.03em", padding: "9px 16px", borderRadius: 6, textDecoration: "none" }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="dkp-nav-links" aria-label="Sign out" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: C.body, border: `1px solid ${C.lineStrong}`, fontSize: 14, fontWeight: 600, padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}>
                    <LogOut size={14} /> Sign Out
                  </button>
<<<<<<< Updated upstream
                </>
              ) : (
                <Link href="/login" className="dkp-btn-ink" style={{ background: C.ink, color: C.white, fontSize: 14, fontWeight: 600, letterSpacing: "0.03em", padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}>Sign In</Link>
              )}
              <button className="dkp-nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu" style={{ display: "none", background: "transparent", border: "none", color: C.ink, cursor: "pointer", padding: 6 }}>
                <Menu size={24} />
              </button>
=======
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Link
                      href="/login"
                      onClick={handleCloseSidebar}
                      style={{
                        width: "100%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10.5px",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: "#ffffff",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1.5px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        textDecoration: "none",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={handleCloseSidebar}
                      style={{
                        width: "100%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10.5px",
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: "#111827",
                        background: "#ffffff",
                        borderRadius: "8px",
                        textDecoration: "none",
                        textAlign: "center",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; }}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}


        {/* ── GUEST HERO ── */}
        {!isAuthenticated && (
        <section style={{ background: "#ffffff", padding: "20px 32px 0", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: isMobile ? "0px" : "4px", position: "relative", zIndex: 10 }}>
                {/* First line and scroll down button on the same line */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "10px" }}>
                  <h1 style={{
                    fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%), var(--avatar-theme-color)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                    lineHeight: isMobile ? 0.95 : 1.1,
                    letterSpacing: "-0.05em",
                    wordSpacing: "0.3em",
                    margin: 0,
                    textTransform: "uppercase",
                  }}>
                    The  Digital
                  </h1>
                  <button
                    className="home-scroll-float"
                    onClick={() => {
                      const nextSection = document.getElementById('network-section');
                      if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "var(--avatar-theme-color, #000)",
                      flexShrink: 0,
                      background: "rgba(255,255,255,0.75)",
                      border: "1.5px solid rgba(0,0,0,0.12)",
                      borderRadius: "100px",
                      cursor: "pointer",
                      padding: isMobile ? "8px" : "8px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      width: isMobile ? "34px" : "auto",
                      height: isMobile ? "34px" : "auto"
                    }}
                  >
                    {!isMobile && <span>Scroll down</span>}
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_downward</span>
                  </button>
                </div>
                {/* Second line */}
                <h1 style={{
                  fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%), var(--avatar-theme-color)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                  lineHeight: isMobile ? 0.95 : 1.1,
                  letterSpacing: "-0.05em",
                  wordSpacing: "0.3em",
                  margin: 0,
                  marginTop: isMobile ? "-2px" : "0px",
                  textTransform: "uppercase",
                  wordBreak: "break-word",
                }}>
                  Knowledge  Platform
                </h1>
              </div>

              <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: isMobile ? "8px" : "12px", position: "relative", alignItems: "flex-end", overflow: "hidden", zIndex: 0 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "1000px", zIndex: 1 }}>
                  <img src="/hero-graphics.png" alt="Platform Graphic" style={{ width: "100%", objectFit: "contain", display: "block", mixBlendMode: "normal", opacity: 1 }} />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    mixBlendMode: "normal",
                    zIndex: 2,
                    pointerEvents: "none",
                    opacity: 0
                  }} />
                </div>

                {/* Horizontal line behind the graphic, stretching full width */}
                <div style={{ position: "absolute", bottom: "2px", left: "-5vw", right: "-5vw", height: "0px", background: "transparent", zIndex: 0 }}></div>
              </div>

              {/* ── TYPEWRITER TEXT ── */}
              <div style={{
                width: "100%",
                maxWidth: "720px",
                padding: "48px 0 12px",
                textAlign: "left",
              }}
              >
                <h2 style={{
                  fontSize: "clamp(1.3rem, 2.5vw, 1.85rem)",
                  fontWeight: 800,
                  color: "var(--avatar-theme-color)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.03em",
                  margin: "0 0 8px",
                  minHeight: "1.25em",
                }}>
                  {headingText}
                  {phase === "heading" && (
                    <span style={{
                      display: "inline-block",
                      width: "2px",
                      height: "1em",
                      background: "var(--avatar-theme-color)",
                      marginLeft: "2px",
                      verticalAlign: "text-bottom",
                      animation: "cursorBlink 0.7s steps(1) infinite",
                    }} />
                  )}
                </h2>
                <p style={{
                  fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)",
                  color: "#555e6d",
                  lineHeight: 1.8,
                  margin: 0,
                  minHeight: "4.5em",
                  fontWeight: 400,
                }}>
                  {bodyText}
                  {(phase === "body") && (
                    <span style={{
                      display: "inline-block",
                      width: "2px",
                      height: "1em",
                      background: "#495057",
                      marginLeft: "2px",
                      verticalAlign: "text-bottom",
                      animation: "cursorBlink 0.7s steps(1) infinite",
                    }} />
                  )}
                </p>
              </div>
>>>>>>> Stashed changes
            </div>
          </div>
        </nav>

<<<<<<< Updated upstream
        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div style={{ position: "fixed", inset: 0, background: C.white, zIndex: 200, display: "flex", flexDirection: "column" }}>
            <div style={{ height: 72, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.lineStrong}` }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.ink }}>DU Digital Knowledge Platform</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", color: C.ink, cursor: "pointer", padding: 6 }}><X size={24} /></button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ padding: "12px 14px", fontSize: 16, fontWeight: 500, color: C.ink, textDecoration: "none", borderRadius: 6 }}>{l.label}</Link>
=======
        {/* ── AUTH CARD - Sign In & Register (For Guests) ── */}
        {!isAuthenticated && (
          <section style={{ background: "linear-gradient(160deg, #f4f6ff 0%, #ffffff 60%)", padding: isMobile ? "32px 16px" : "72px 32px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>
                <div style={{ textAlign: "center", maxWidth: "560px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--avatar-theme-color)", margin: "0 0 14px 0", opacity: 0.8 }}>
                    Get Started Today
                  </p>
                  <h2 style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                    fontWeight: 800,
                    color: "var(--avatar-theme-color, #1a1a2e)",
                    margin: "0 0 14px 0",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                  }}>
                    Ready to Join Us?
                  </h2>
                  <p style={{
                    fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)",
                    color: "#6b7280",
                    lineHeight: 1.7,
                    margin: 0,
                    fontWeight: 400,
                  }}>
                    Access academic resources, collaborate with researchers, and explore knowledge from the university.
                  </p>
                </div>

                {/* Auth Buttons */}
                <div style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  width: "100%"
                }}>
                  {/* Sign In Button */}
                  <Link
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "13px 36px",
                      fontSize: "14.5px",
                      fontWeight: 600,
                      color: "var(--avatar-theme-color, #1a56db)",
                      background: "#ffffff",
                      border: "2px solid var(--avatar-theme-color, #1a56db)",
                      borderRadius: "12px",
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--avatar-theme-color, #1a56db)";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
                    }}
                  >
                    Sign In
                  </Link>

                  {/* Register Button */}
                  <Link
                    href="/register"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "13px 36px",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#ffffff",
                      background: "var(--avatar-theme-color, #1a56db)",
                      border: "2px solid var(--avatar-theme-color, #1a56db)",
                      borderRadius: "12px",
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.88";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.22)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.18)";
                    }}
                  >
                    <span>Sign Up</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── LIVE PLATFORM STATS ────────────────────────────────────────────── */}
        <section className="home-stats-section" style={{ background: "#ffffff", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <Reveal>
              <div className="home-stats-heading" style={{ textAlign: "center", marginBottom: "52px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,13,18,0.55)", margin: "0 0 12px 0" }}>
                  The Platform in Numbers
                </p>
                <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, color: "#0d0d12", margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                  A Living Knowledge Base
                </h2>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0" }} className="home-stats-grid">
              {[
                { label: "Archive Documents", value: stats.archive },
                { label: "Research Outputs",  value: stats.research },
                { label: "Books in Catalog",  value: stats.catalog },
                { label: "Student Projects",  value: stats.showcase },
              ].map(({ label, value }, i) => (
                <Reveal key={label} delay={i * 90}>
                  <div className="home-stat-cell" style={{ padding: "8px 24px", textAlign: "center" }}>
                    <p className="home-stat-value" style={{ fontSize: "clamp(44px, 6vw, 64px)", fontWeight: 800, color: "#0d0d12", margin: "0 0 8px 0", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                      <CountUp value={value} />
                    </p>
                    <p className="home-stat-label" style={{ fontSize: "12px", color: "#71717a", margin: 0, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
                  </div>
                </Reveal>
>>>>>>> Stashed changes
              ))}
              <Link href={isAuthenticated ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)} style={{ marginTop: 8, padding: "12px 14px", fontSize: 16, fontWeight: 600, color: C.white, background: C.ink, textDecoration: "none", borderRadius: 6, textAlign: "center" }}>
                {isAuthenticated ? "Go to Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
<<<<<<< Updated upstream
        )}

        <main style={{ flex: 1 }}>
          {/* ── HERO ── */}
          <section style={{ position: "relative", background: C.white, padding: "clamp(48px, 7vw, 80px) clamp(16px, 4vw, 64px) clamp(72px, 9vw, 104px)", overflow: "hidden" }}>
            <div className="dkp-hero-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
=======
        </section>

        {/* ── EXPLORE THE PLATFORM ───────────────────────────────────────────── */}
        <section className="home-explore-section" style={{ background: "#fafaf8", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <Reveal>
              <div className="home-explore-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "52px" }}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,13,18,0.55)", margin: "0 0 12px 0" }}>
                    Explore
                  </p>
                  <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, color: "#0d0d12", margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                    Four Collections, One Platform
                  </h2>
                </div>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }} className="home-explore-grid">
              {QUICK_LINKS.map(({ label, href, icon: Icon, bg, desc }, i) => (
                <Reveal key={href} delay={i * 90}>
                  <Link
                    href={href}
                    className="home-card-lift home-explore-card"
                    style={{ background: bg, borderRadius: "18px", padding: "30px 26px", display: "flex", flexDirection: "column", gap: "14px", textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)", height: "100%", boxSizing: "border-box" }}
                  >
                    <div className="home-card-icon" style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} color="#ffffff" />
                    </div>
                    <div>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "0 0 6px 0", letterSpacing: "-0.015em" }}>{label}</p>
                      <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.55 }}>{desc}</p>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: "auto" }}>
                      Browse <span className="home-cta-arrow" style={{ display: "inline-flex" }}><ArrowRight size={13} /></span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUILT FOR EVERY ROLE ───────────────────────────────────────────── */}
        <section className="home-roles-section" style={{ background: "#ffffff", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: "52px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,13,18,0.55)", margin: "0 0 12px 0" }}>
                  Role-Based Workspaces
                </p>
                <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, color: "#0d0d12", margin: "0 0 14px 0", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                  Built for Every Role on Campus
                </h2>
                <p style={{ fontSize: "16px", color: "#52525b", margin: "0 auto", maxWidth: "540px", lineHeight: 1.65 }}>
                  Six access levels, each with its own dashboard, permissions, and tools, enforced on every request.
                </p>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }} className="home-role-grid home-roles-grid">
              {ROLE_CARDS.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={(i % 3) * 90}>
                  <div className="home-card-lift home-role-card" style={{ background: "#fafaf8", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "18px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "14px", cursor: "default", height: "100%", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="home-card-icon home-role-icon" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#0d0d12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={17} color="#ffffff" />
                      </div>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "#0d0d12", margin: 0, letterSpacing: "-0.015em" }}>{title}</p>
                    </div>
                    <p style={{ fontSize: "14px", color: "#52525b", margin: 0, lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FRESH FROM THE PLATFORM ────────────────────────────────────────── */}
        {(latestResearch.length > 0 || latestArchive.length > 0) && (
          <section className="home-latest-section" style={{ background: "#fafaf8", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <Reveal>
                <div className="home-latest-heading" style={{ marginBottom: "52px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,13,18,0.55)", margin: "0 0 12px 0" }}>
                    Fresh From the Platform
                  </p>
                  <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, color: "#0d0d12", margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                    Recently Added
                  </h2>
                </div>
              </Reveal>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }} className="home-latest-grid">
                {[
                  { heading: "Latest Research", href: "/research", items: latestResearch.map(r => ({ key: r.output_id, href: `/research/${r.output_id}`, title: r.title, meta: r.output_type?.replace(/_/g, " "), date: r.published_date, icon: FlaskConical })) },
                  { heading: "New in the Archive", href: "/archive", items: latestArchive.map(a => ({ key: a.item_id, href: `/archive/${a.item_id}`, title: a.title_en, meta: a.category, date: a.created_at, icon: FileText })) },
                ].map(({ heading, href, items }, col) => (
                  <Reveal key={heading} delay={col * 120} style={{ minWidth: 0, width: "100%" }}>
                    <div className="home-latest-col" style={{ minWidth: 0, width: "100%" }}>
                      <div className="home-latest-col-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#0d0d12", margin: 0, letterSpacing: "-0.015em" }}>{heading}</p>
                        <Link href={href} className="home-latest-viewall" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600, color: "#0d0d12", textDecoration: "none", borderBottom: "1px solid #0d0d12", paddingBottom: "1px" }}>
                          View all <ArrowRight size={12} />
                        </Link>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {items.map(({ key, href: itemHref, title, meta, date, icon: Icon }) => (
                          <Link
                            key={key}
                            href={itemHref}
                            className="home-latest-row"
                            style={{ background: "#ffffff", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}
                          >
                            <div className="home-latest-icon" style={{ width: "38px", height: "38px", borderRadius: "11px", background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={15} color="#0d0d12" />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0d0d12", margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                              <p style={{ fontSize: "12px", color: "#71717a", margin: 0, textTransform: "capitalize", display: "flex", alignItems: "center", gap: "6px", fontVariantNumeric: "tabular-nums" }}>
                                {meta}
                                {date && <><span>·</span><Calendar size={10} /> {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>}
                              </p>
                            </div>
                            <span className="home-cta-arrow" style={{ display: "inline-flex", flexShrink: 0 }}><ArrowRight size={14} color="#71717a" /></span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS (guests) ──────────────────────────────────────────── */}
        {!isAuthenticated && (
          <section className="home-getting-started-section" style={{ background: "#ffffff", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <Reveal>
                <div className="home-getting-started-heading" style={{ textAlign: "center", marginBottom: "52px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,13,18,0.55)", margin: "0 0 12px 0" }}>
                    Getting Started
                  </p>
                  <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, color: "#0d0d12", margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
                    Three Steps to Join
                  </h2>
                </div>
              </Reveal>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }} className="home-steps-grid home-steps">
                {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
                  <Reveal key={step} delay={i * 140}>
                    <div className="home-step-cell" style={{ padding: "28px 24px", textAlign: "center", position: "relative" }}>
                      <p className="home-step-number" style={{ fontSize: "72px", fontWeight: 800, color: "rgba(13,13,18,0.04)", margin: "0 0 -52px 0", letterSpacing: "-0.05em", userSelect: "none", lineHeight: 1 }}>{step}</p>
                      <div className="home-step-icon" style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#0d0d12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", position: "relative", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", animationDelay: `${i * 0.4}s` }}>
                        <Icon size={20} color="#ffffff" />
                      </div>
                      <p className="home-step-title" style={{ fontSize: "17px", fontWeight: 700, color: "#0d0d12", margin: "0 0 8px 0", letterSpacing: "-0.015em" }}>{title}</p>
                      <p className="home-step-desc" style={{ fontSize: "14px", color: "#52525b", margin: "0 auto", maxWidth: "250px", lineHeight: 1.65 }}>{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section id="network-section" style={{ background: "var(--theme-sidebar-gradient)", padding: "80px 32px 72px" }} className="home-partner-section">
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "48px" }}>
>>>>>>> Stashed changes
              <div>
                <h1 style={{ fontFamily: SERIF, fontSize: "clamp(34px, 5.4vw, 48px)", fontWeight: 700, color: C.ink, margin: "0 0 22px", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
                  The Digital<br />Knowledge Platform
                </h1>
                <p style={{ fontSize: "clamp(16px, 1.9vw, 18px)", color: C.body, margin: "0 0 36px", lineHeight: 1.6, maxWidth: 560 }}>
                  A Living Knowledge Base. Access academic resources, collaborate with researchers, and explore knowledge from the University of Dhaka.
                </p>
<<<<<<< Updated upstream
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  <Link href={isAuthenticated ? "/dashboard" : "/register"} className="dkp-btn-ink" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.ink, color: C.white, fontSize: 15, fontWeight: 600, letterSpacing: "0.03em", padding: "14px 26px", borderRadius: 6, textDecoration: "none" }}>
                    {isAuthenticated ? "Go to Dashboard" : "Get Started Today"} <ArrowRight size={18} />
                  </Link>
                  {!isAuthenticated && (
                    <Link href="/login" style={{ display: "inline-flex", alignItems: "center", background: "transparent", color: C.ink, border: `1.5px solid ${C.lineStrong}`, fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 6, textDecoration: "none" }}>Sign In</Link>
                  )}
                </div>
              </div>
              <div className="dkp-hero-img" style={{ position: "relative" }}>
                <img src="/hero-library.png" alt="University of Dhaka library reading room" style={{ width: "100%", height: 400, objectFit: "cover", borderRadius: 12, boxShadow: "0 4px 24px rgba(26,26,46,0.12)", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.10)", borderRadius: 12 }} />
              </div>
=======
                <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#ffffff", margin: "0 0 8px 0", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  Our Faculty Network
                </h2>
                <p style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.72)", margin: 0, fontWeight: 400, lineHeight: 1.65, maxWidth: "460px" }}>
                  Powering Innovation and Engineering Research at the University of Dhaka
                </p>
              </div>

            </div>

            {/* Partner card grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }} className="home-partner-grid">
              {PARTNERS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: "14px",
                    padding: "22px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "default",
                    transition: "all 0.24s ease",
                  }}
                  className="home-partner-item"
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.18)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  }}
                >
                  <span style={{
                    alignSelf: isMobile ? "center" : "flex-start",
                    padding: "4px 10px",
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "0.06em",
                  }}>
                    {p.name}
                  </span>
                  {!isMobile && (
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      {p.full}
                    </p>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer style={{ background: "#f0f2f5", borderTop: "1px solid #dde0e6", position: "relative" }}>

          {/* Footer body — 4 columns */}
          <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 32px 40px",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "40px",
          }} className="home-footer home-footer-body">

            {/* Brand column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: isMobile ? "0px" : "14px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap size={14} color="#ffffff" />
                </div>
                <span style={{ fontSize: "15.5px", fontWeight: 800, color: "var(--avatar-theme-color)", letterSpacing: "-0.025em" }}>
                  Digital Knowledge Platform
                </span>
              </div>
              {!isMobile && (
                <>
                  <p className="home-footer-desc" style={{ fontSize: "13.5px", color: "#4b5563", margin: "0 0 16px 0", lineHeight: 1.7, maxWidth: "280px" }}>
                    A unified academic knowledge system for archives, research, and library resources at the University of Dhaka.
                  </p>
                  <p style={{ fontSize: "12.5px", color: "#6b7280", margin: 0 }}>
                    Built by <strong style={{ color: "#374151" }}>Semicolon-Squad-DU</strong>
                  </p>
                </>
              )}
>>>>>>> Stashed changes
            </div>
            <button
              onClick={() => document.getElementById("dkp-stats")?.scrollIntoView({ behavior: "smooth" })}
              className="dkp-scroll"
              aria-label="Scroll down"
              style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "transparent", border: "none", color: C.body, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: 12, fontWeight: 500 }}>Scroll down</span>
              <ArrowDown size={18} />
            </button>
          </section>

<<<<<<< Updated upstream
          {/* ── STATS ── */}
          <section id="dkp-stats" style={{ background: C.band, borderTop: `1px solid ${C.line}`, padding: "clamp(48px, 6vw, 64px) clamp(16px, 4vw, 64px)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <Reveal><div style={{ textAlign: "center", marginBottom: 48 }}>{h2("A Living Knowledge Base")}</div></Reveal>
              <div className="dkp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }}>
                {STAT_ITEMS.map(({ label, value }, i) => (
                  <Reveal key={label} delay={i * 90}>
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: "clamp(32px, 4.4vw, 44px)", fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                        <CountUp value={value} />
                      </div>
                      <div style={{ fontSize: 16, color: C.body }}>{label}</div>
                    </div>
                  </Reveal>
=======
            {/* Legal column */}
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--avatar-theme-color, #111827)", margin: "0 0 16px 0" }} className="footer-header-text">
                Legal
              </p>
              <div className="home-footer-legal-links" style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact Us", href: "/contact" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    style={{ fontSize: "13.5px", color: "#4b5563", textDecoration: "none", fontWeight: 400, transition: "color 0.18s", lineHeight: 1.6 }}
                    className="footer-link-text"
                    onMouseEnter={e => e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                  >{l.label}</Link>
>>>>>>> Stashed changes
                ))}
              </div>
            </div>
          </section>

<<<<<<< Updated upstream
          {/* ── FOUR COLLECTIONS ── */}
          <section style={{ background: C.white, borderTop: `1px solid ${C.line}`, padding: "clamp(64px, 8vw, 80px) clamp(16px, 4vw, 64px)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                  {h2("Four Collections, One Platform")}
                  <p style={{ fontSize: 16, color: C.body, maxWidth: 620, margin: "16px auto 0", lineHeight: 1.6 }}>Explore distinct repositories tailored to preserve and showcase specific facets of academic life.</p>
                </div>
              </Reveal>
              <div className="dkp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
                {COLLECTIONS.map(({ icon: Icon, title, href, cta, desc }, i) => (
                  <Reveal key={title} delay={i * 80}>
                    <Link href={href} className="dkp-card" style={{ display: "flex", flexDirection: "column", height: "100%", background: C.white, border: `1px solid ${C.lineStrong}`, borderRadius: 10, padding: 24, textDecoration: "none", boxShadow: "0 4px 24px rgba(26,26,46,0.05)" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: C.chip, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                        <Icon size={22} />
                      </div>
                      <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>{title}</h3>
                      <p style={{ fontSize: 15, color: C.body, margin: "0 0 24px", lineHeight: 1.55, flex: 1 }}>{desc}</p>
                      <span className="dkp-collink" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600, letterSpacing: "0.03em", color: C.accent, marginTop: "auto" }}>
                        {cta} <ChevronRight size={16} className="dkp-arrow" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
=======
            {/* Team column */}
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--avatar-theme-color, #111827)", margin: "0 0 16px 0" }} className="footer-header-text">
                Team
              </p>
              <p style={{ fontSize: "13.5px", color: "#1f2937", margin: "0 0 10px 0", fontWeight: 700 }} className="footer-link-text">Semicolon-Squad-DU</p>
>>>>>>> Stashed changes
            </div>
          </section>

          {/* ── ROLE-BASED WORKSPACES ── */}
          <section style={{ background: C.band, borderTop: `1px solid ${C.line}`, padding: "clamp(64px, 8vw, 80px) clamp(16px, 4vw, 64px)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                  {sectionLabel("Role-Based Workspaces")}
                  {h2("Built for Every Role on Campus")}
                  <p style={{ fontSize: 16, color: C.body, maxWidth: 620, margin: "16px auto 0", lineHeight: 1.6 }}>Six access levels, each with its own dashboard, permissions, and tools — enforced on every request.</p>
                </div>
              </Reveal>
              <div className="dkp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                {ROLES.map(({ title, desc }, i) => (
                  <Reveal key={title} delay={(i % 3) * 90}>
                    <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: 24, height: "100%", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(26,26,46,0.04)" }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>{title}</h3>
                      <p style={{ fontSize: 15, color: C.body, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── GETTING STARTED ── */}
          <section style={{ background: C.white, borderTop: `1px solid ${C.line}`, padding: "clamp(64px, 8vw, 80px) clamp(16px, 4vw, 64px)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <Reveal>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                  {sectionLabel("Getting Started")}
                  {h2("Three Steps to Join")}
                </div>
              </Reveal>
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} className="dkp-grid-3">
                <div className="dkp-steps-line" style={{ position: "absolute", top: 48, left: "16%", right: "16%", height: 2, background: C.connector, zIndex: 0 }} />
                {STEPS.map(({ n, title, desc }, i) => (
                  <Reveal key={n} delay={i * 120}>
                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                      <div style={{ width: 96, height: 96, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontFamily: SERIF, fontSize: 30, fontWeight: 700, background: i === 0 ? C.ink : C.band, color: i === 0 ? C.white : C.ink }}>{n}</div>
                      <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>{title}</h3>
                      <p style={{ fontSize: 15, color: C.body, margin: 0, lineHeight: 1.6, maxWidth: 260 }}>{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── FACULTY NETWORK ── */}
          <section style={{ background: C.white, borderTop: `1px solid ${C.line}`, padding: "clamp(64px, 8vw, 80px) clamp(16px, 4vw, 64px)" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
              <Reveal>
                <div style={{ marginBottom: 48 }}>
                  {sectionLabel("Partnered Faculties")}
                  {h2("Our Faculty Network")}
                  <p style={{ fontSize: 16, color: C.body, margin: "16px auto 0", lineHeight: 1.6 }}>Powering Innovation and Engineering Research at the University of Dhaka</p>
                </div>
              </Reveal>
              <div className="dkp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
                {FACULTIES.map((f, i) => (
                  <Reveal key={f.name} delay={(i % 4) * 70}>
                    <div className="dkp-fac" style={{ padding: 18, border: `1px solid ${C.line}`, borderRadius: 10, transition: "border-color .2s ease" }}>
                      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: C.body, lineHeight: 1.4 }}>{f.full}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ background: C.white, borderTop: `1px solid ${C.lineStrong}` }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px clamp(16px, 4vw, 64px)", display: "flex", flexDirection: "column", gap: 24, alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.ink }}>
              <Library size={22} /> DU Digital Knowledge Platform
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
              {[
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "About", href: "/about" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 600, color: C.body, textDecoration: "none" }}>{l.label}</Link>
              ))}
            </div>
            <div style={{ fontSize: 14, color: C.body }}>© {new Date().getFullYear()} University of Dhaka · Built by Semicolon-Squad-DU</div>
          </div>
        </footer>
      </div>
    </>
  );
}
