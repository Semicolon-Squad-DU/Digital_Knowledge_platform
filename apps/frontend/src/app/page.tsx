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
  return <span ref={ref}>{value === null ? "—" : display.toLocaleString()}</span>;
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
          .dkp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .dkp-card, .dkp-arrow { transition: none !important; }
          .dkp-scroll { animation: none !important; }
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
                </>
              ) : (
                <Link href="/login" className="dkp-btn-ink" style={{ background: C.ink, color: C.white, fontSize: 14, fontWeight: 600, letterSpacing: "0.03em", padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}>Sign In</Link>
              )}
              <button className="dkp-nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu" style={{ display: "none", background: "transparent", border: "none", color: C.ink, cursor: "pointer", padding: 6 }}>
                <Menu size={24} />
              </button>
            </div>
          </div>
        </nav>

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
              ))}
              <Link href={isAuthenticated ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)} style={{ marginTop: 8, padding: "12px 14px", fontSize: 16, fontWeight: 600, color: C.white, background: C.ink, textDecoration: "none", borderRadius: 6, textAlign: "center" }}>
                {isAuthenticated ? "Go to Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
        )}

        <main style={{ flex: 1 }}>
          {/* ── HERO ── */}
          <section style={{ position: "relative", background: C.white, padding: "clamp(48px, 7vw, 80px) clamp(16px, 4vw, 64px) clamp(72px, 9vw, 104px)", overflow: "hidden" }}>
            <div className="dkp-hero-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
              <div>
                <h1 style={{ fontFamily: SERIF, fontSize: "clamp(34px, 5.4vw, 48px)", fontWeight: 700, color: C.ink, margin: "0 0 22px", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
                  The Digital<br />Knowledge Platform
                </h1>
                <p style={{ fontSize: "clamp(16px, 1.9vw, 18px)", color: C.body, margin: "0 0 36px", lineHeight: 1.6, maxWidth: 560 }}>
                  A Living Knowledge Base. Access academic resources, collaborate with researchers, and explore knowledge from the University of Dhaka.
                </p>
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
                ))}
              </div>
            </div>
          </section>

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
