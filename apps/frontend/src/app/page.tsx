"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Archive, BookOpen, FlaskConical, Star, LogOut, LayoutDashboard, ArrowRight, GraduationCap, Menu, X, ShieldCheck, UserRound, Landmark, MailCheck, Rocket, FileText, Calendar, Camera } from "lucide-react";

const PARTNERS = [
  { id: 1, name: "CSE",  full: "Computer Science & Engineering" },
  { id: 2, name: "EEE",  full: "Electrical & Electronic Engineering" },
  { id: 3, name: "IIT",  full: "Institute of Information Technology" },
  { id: 4, name: "RME",  full: "Robotics & Mechatronics Engineering" },
  { id: 5, name: "GEB",  full: "Genetic Engineering & Biotechnology" },
  { id: 6, name: "PHR",  full: "Pharmacy" },
  { id: 7, name: "NE",   full: "Nuclear Engineering" },
  { id: 8, name: "ACCE", full: "Applied Chemistry & Chemical Eng." },
];



// Where a signed-in user's "Dashboard" button should land, by role. Mirrors the
// same mapping used on the login page so the landing-page shortcut is consistent.
function roleHome(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "librarian") return "/librarian";
  return "/dashboard";
}

const QUICK_LINKS = [
  { label: "Browse Archive", href: "/archive", icon: Archive, bg: "linear-gradient(160deg, #1a1a1d 0%, #101013 100%)", color: "#ffffff", desc: "Search institutional documents" },
  { label: "Library Catalog", href: "/library", icon: BookOpen, bg: "linear-gradient(160deg, #1a1a1d 0%, #101013 100%)", color: "#ffffff", desc: "Books, journals & more" },
  { label: "Research Repository", href: "/research", icon: FlaskConical, bg: "linear-gradient(160deg, #1a1a1d 0%, #101013 100%)", color: "#ffffff", desc: "Faculty publications & datasets" },
  { label: "Showcase Gallery", href: "/showcase", icon: Star, bg: "linear-gradient(160deg, #1a1a1d 0%, #101013 100%)", color: "#ffffff", desc: "Student project highlights" },
];

const TYPEWRITER_HEADING = "Empowering Research, Learning & Innovation";
const TYPEWRITER_BODY = "Discover academic resources, explore student research projects, browse digital archives, and connect with university knowledge systems from a single intelligent platform.";

const ROLE_CARDS = [
  { icon: UserRound,    title: "Members",         desc: "Borrow books, place holds, and build a personal reading wishlist from the full catalog." },
  { icon: Star,         title: "Student Authors", desc: "Publish course projects to the university showcase with advisor review and feedback." },
  { icon: FlaskConical, title: "Researchers",     desc: "Submit publications and datasets with DOIs, citations, and lab affiliations." },
  { icon: Archive,      title: "Archivists",      desc: "Preserve institutional documents with versioning and tiered access control." },
  { icon: BookOpen,     title: "Librarians",      desc: "Issue and return books, manage fines, and keep the lending catalog moving." },
  { icon: ShieldCheck,  title: "Administrators",  desc: "Approve accounts, audit every sensitive action, and configure the platform." },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Landmark,  title: "Register",   desc: "Sign up with your institutional university email address." },
  { step: "02", icon: MailCheck, title: "Verify",     desc: "Enter the 6-digit code we send to your inbox to activate your account." },
  { step: "03", icon: Rocket,    title: "Contribute", desc: "Land in a workspace built for your role and start exploring." },
];

// Animated counter ΓÇö starts counting only when scrolled into view
function CountUp({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      obs.disconnect();
      const duration = 1400;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={ref}>{value === null ? "0" : display.toLocaleString()}</span>;
}

// Fade-up on scroll ΓÇö one observer per element, disconnects after firing,
// transform/opacity only so it never causes layout work
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`home-reveal${visible ? " is-visible" : ""}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [headingText, setHeadingText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [phase, setPhase] = useState<"heading" | "body" | "done">("heading");
  const [line1Text, setLine1Text] = useState("");
  const [line2Text, setLine2Text] = useState("");
  const [authPhase, setAuthPhase] = useState<"line1" | "line2" | "done">("line1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);

  // Live platform data for the stats strip and latest-content section
  const [stats, setStats] = useState<{ archive: number | null; research: number | null; showcase: number | null; catalog: number | null }>({
    archive: null, research: null, showcase: null, catalog: null,
  });
  const [latestResearch, setLatestResearch] = useState<Array<{ output_id: string; title: string; output_type: string; published_date?: string }>>([]);
  const [latestArchive, setLatestArchive] = useState<Array<{ item_id: string; title_en: string; category: string; created_at?: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [arch, res, show, cat] = await Promise.allSettled([
        api.get("/archive/search", { params: { limit: 3 } }),
        api.get("/research", { params: { limit: 3 } }),
        api.get("/showcase", { params: { limit: 1 } }),
        api.get("/library/catalog/search", { params: { limit: 1 } }),
      ]);
      if (cancelled) return;
      setStats({
        archive:  arch.status === "fulfilled" ? arch.value.data.data.total ?? null : null,
        research: res.status  === "fulfilled" ? res.value.data.data.total ?? null : null,
        showcase: show.status === "fulfilled" ? show.value.data.data.total ?? show.value.data.data.items?.length ?? null : null,
        catalog:  cat.status  === "fulfilled" ? cat.value.data.data.total ?? null : null,
      });
      if (res.status === "fulfilled")  setLatestResearch(res.value.data.data.items ?? []);
      if (arch.status === "fulfilled") setLatestArchive(arch.value.data.data.items ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  const AUTH_LINE_1 = "Yuki-2,";
  const AUTH_LINE_2 = "your research workspace is ready.";

  useEffect(() => {
    let idx = 0;
    let timer: NodeJS.Timeout;
    let pauseTimer: NodeJS.Timeout;

    if (phase === "heading") {
      timer = setInterval(() => {
        idx++;
        setHeadingText(TYPEWRITER_HEADING.slice(0, idx));
        if (idx >= TYPEWRITER_HEADING.length) {
          clearInterval(timer);
          setTimeout(() => setPhase("body"), 500);
        }
      }, 80);
    } else if (phase === "body") {
      timer = setInterval(() => {
        idx++;
        setBodyText(TYPEWRITER_BODY.slice(0, idx));
        if (idx >= TYPEWRITER_BODY.length) {
          clearInterval(timer);
          setPhase("done");
        }
      }, 40);
    } else if (phase === "done") {
      pauseTimer = setTimeout(() => {
        setHeadingText("");
        setBodyText("");
        setPhase("heading");
      }, 8000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(pauseTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let idx = 0;
    let timer: NodeJS.Timeout;
    let pauseTimer: NodeJS.Timeout;

    if (authPhase === "line1") {
      timer = setInterval(() => {
        idx++;
        setLine1Text(AUTH_LINE_1.slice(0, idx));
        if (idx >= AUTH_LINE_1.length) {
          clearInterval(timer);
          setTimeout(() => setAuthPhase("line2"), 300);
        }
      }, 80);
    } else if (authPhase === "line2") {
      timer = setInterval(() => {
        idx++;
        setLine2Text(AUTH_LINE_2.slice(0, idx));
        if (idx >= AUTH_LINE_2.length) {
          clearInterval(timer);
          setAuthPhase("done");
        }
      }, 50);
    } else if (authPhase === "done") {
      pauseTimer = setTimeout(() => {
        setLine1Text("");
        setLine2Text("");
        setAuthPhase("line1");
      }, 3000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(pauseTimer);
    };
  }, [authPhase, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 769);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 64) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes homeMenuIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes homeFloat { from { transform: translateY(0); } to { transform: translateY(-6px); } }

        /* Scroll-reveal: transform/opacity only, GPU-composited */
        .home-reveal { opacity: 0; transform: translateY(26px); transition: opacity .65s cubic-bezier(.22,.61,.36,1), transform .65s cubic-bezier(.22,.61,.36,1); }
        .home-reveal.is-visible { opacity: 1; transform: none; }

        /* Card micro-interactions (CSS-only, no JS handlers) */
        .home-card-lift { transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s ease, border-color .28s ease, background .28s ease; }
        .home-card-lift:hover { transform: translateY(-6px); box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 12px 28px rgba(0,0,0,.09); }
        .home-explore-card:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 16px 40px rgba(0,0,0,.32) !important; }
        .home-card-icon { transition: transform .28s cubic-bezier(.34,1.56,.64,1); }
        .home-card-lift:hover .home-card-icon { transform: scale(1.12) rotate(-5deg); }
        .home-cta-arrow { transition: transform .22s ease; }
        .home-card-lift:hover .home-cta-arrow, .home-latest-row:hover .home-cta-arrow { transform: translateX(5px); }
        .home-latest-row { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .home-latest-row:hover { transform: translateX(5px); box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 20px rgba(0,0,0,.07); }
        .home-step-icon { animation: homeFloat 3.2s ease-in-out infinite alternate; }
        .home-scroll-float { animation: homeFloat 1.8s ease-in-out infinite alternate; }

        /* Stats: hairline dividers between borderless columns */
        .home-stats-grid > div { border-left: 1px solid #e4e4e7; }
        .home-stats-grid > div:first-child { border-left: none; }

        /* How-it-works: hairline connector across the three steps (desktop) */
        .home-steps { position: relative; }
        .home-steps::before { content: ""; position: absolute; top: 72px; left: 12%; right: 12%; height: 1px; background: #e4e4e7; }

        @media (max-width: 768px) {
          .home-stats-grid > div { border-left: none !important; }
          .home-steps::before { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .home-card-lift, .home-latest-row, .home-card-icon, .home-cta-arrow { transition: none !important; }
          .home-step-icon { animation: none !important; }
        }
        @media (max-width: 768px) {
          /* ΓöÇΓöÇ Mobile-only layout pass ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
             number/label roughly half their desktop size ΓÇö the clamp() min of
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
             (not stacked) ΓÇö shrink the icon, numeral, and copy so all three
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
             ΓÇö smaller padding/icon/text than the generic card rule above so
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
            background: linear-gradient(180deg, #f1f3ff 0%, #ffffff 55%) !important;
            padding: 36px 24px !important;
          }
          .home-explore-section {
            background: linear-gradient(180deg, #f5f6ff 0%, #fafaf8 60%) !important;
            padding: 32px 24px !important;
          }
          .home-roles-section {
            background: linear-gradient(180deg, #ffffff 0%, #f1f3ff 100%) !important;
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
        }
      `}} />

      <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>

        <header style={{ background: "#eaecef", borderBottom: "1px solid #c8c5cd", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: isMobile ? "relative" : "sticky", top: 0, zIndex: 50, transform: !isMobile && !headerVisible ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.35s ease" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px" }}>

            {/* ΓöÇΓöÇ MOBILE & DESKTOP: Left brand/group layout ΓöÇΓöÇ */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Hamburger Button (shown only on mobile) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex md:hidden"
                style={{ alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "8px", color: "#141b2b", borderRadius: "6px", marginLeft: "-8px" }}
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>

              {/* Logo (always on left) */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--avatar-theme-color, #141b2b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={16} color="#ffffff" />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--avatar-theme-color, #141b2b)", letterSpacing: "-0.02em" }}>DKP</span>
              </div>
            </div>

            {/* ΓöÇΓöÇ DESKTOP NAVIGATION: nav links centered between logo and actions ΓöÇΓöÇ */}
            <nav className="hidden md:flex" style={{ alignItems: "center", justifyContent: "center", gap: "4px", flex: 1, marginLeft: "20px" }}>
              {[
                { label: "Archive",  href: "/archive"  },
                { label: "Library",  href: "/library"  },
                { label: "Research", href: "/research" },
                { label: "Showcase", href: "/showcase" },
                { label: "About",    href: "/about"    },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ padding: "6px 14px", fontSize: "13.5px", fontWeight: 500, color: "#4b5563", textDecoration: "none", borderRadius: "6px", letterSpacing: "0.01em", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#c8c5cd"; e.currentTarget.style.color = "#141b2b"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
                >{item.label}</Link>
              ))}
            </nav>
            <div className="hidden md:flex" style={{ alignItems: "center", justifyContent: "flex-end", gap: 10, minWidth: "170px", flexShrink: 0 }}>
              {isAuthenticated && (
                <>
                  <Link
                    href={roleHome(user?.role)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 15px", fontSize: "13px", fontWeight: 600, color: "#ffffff", background: "#141b2b", border: "1.5px solid #141b2b", borderRadius: "8px", textDecoration: "none", letterSpacing: "0.01em", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#000000"; e.currentTarget.style.borderColor = "#000000"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#141b2b"; e.currentTarget.style.borderColor = "#141b2b"; }}
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", fontSize: "13px", fontWeight: 500, color: "#4b5563", background: "transparent", border: "1.5px solid #c8c5cd", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.01em", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "#c8c5cd"; }}
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Full-screen mobile menu */}
        {sidebarOpen && (
          <>
            {/* Backdrop / Overlay */}
            <div
              onClick={handleCloseSidebar}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 199,
                animation: "fadeIn 0.25s ease-out",
              }}
            />
            {/* Sidebar content */}
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "80%",
              height: "100%",
              backgroundImage: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, #111116 100%)",
              color: "#ffffff",
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
              animation: "slideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
              {/* Top bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                <Link href="/" onClick={handleCloseSidebar} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <GraduationCap size={16} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>DKP</span>
                </Link>
                <button onClick={handleCloseSidebar} aria-label="Close menu" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center" }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

               {/* User Info Header */}
              {isAuthenticated ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <Link href="/profile" onClick={handleCloseSidebar} style={{ position: "relative", textDecoration: "none", display: "block", cursor: "pointer" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "var(--avatar-theme-color, #141b2b)", boxShadow: "0 4px 12px rgba(0,0,0,0.24)" }}>
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "22px", height: "22px", borderRadius: "50%", background: "var(--avatar-theme-color, #141b2b)", border: "2px solid #111116", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                      <Camera size={11} color="#ffffff" strokeWidth={2.5} />
                    </div>
                  </Link>
                  <div>
                    <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>{user?.name}</p>
                    <span style={{ fontSize: "11px", color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>Sign In Mode</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--avatar-theme-color, #141b2b)", boxShadow: "0 4px 12px rgba(0,0,0,0.24)" }}>
                    <UserRound size={32} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Guest User</p>
                    <span style={{ fontSize: "11px", color: "#f87171", background: "rgba(239, 68, 68, 0.2)", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>Guest Mode</span>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
                {[
                  { label: "Archive",  href: "/archive"  },
                  { label: "Library",  href: "/library"  },
                  { label: "Research", href: "/research" },
                  { label: "Showcase", href: "/showcase" },
                  { label: "About",    href: "/about"    },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleCloseSidebar}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.75)",
                      textDecoration: "none",
                      borderRadius: "8px",
                      letterSpacing: "0.01em",
                      background: "rgba(255, 255, 255, 0.05)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.color = "#ffffff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                  >{item.label}</Link>
                ))}
              </div>

              {/* Drawer Auth Actions Footer */}
              <div style={{ padding: "12px 16px 20px 16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.15)" }}>
                {isAuthenticated ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Link
                      href={roleHome(user?.role)}
                      onClick={handleCloseSidebar}
                      style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10.5px", fontSize: "13.5px", fontWeight: 700, color: "#141b2b", background: "#ffffff", border: "none", borderRadius: "8px", textDecoration: "none", boxSizing: "border-box", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                    >
                      <LayoutDashboard size={14} /> Go to Dashboard
                    </Link>
                    <button
                      onClick={() => { handleLogout(); handleCloseSidebar(); }}
                      style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", fontSize: "13.5px", fontWeight: 600, color: "#fca5a5", background: "rgba(239, 68, 68, 0.15)", border: "1.5px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
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
                        color: "#141b2b",
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


        {/* ΓöÇΓöÇ GUEST HERO ΓöÇΓöÇ */}
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

              {/* ΓöÇΓöÇ TYPEWRITER TEXT ΓöÇΓöÇ */}
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
            </div>
          </div>
        </section>
        )}{/* end guest hero */}

        {/* ΓöÇΓöÇ AUTH CARD - Sign In & Register (For Guests) ΓöÇΓöÇ */}
        {!isAuthenticated && (
          <section style={{ background: "linear-gradient(160deg, #f1f3ff 0%, #ffffff 60%)", padding: isMobile ? "32px 16px" : "72px 32px", borderTop: "1px solid #c8c5cd" }}>
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
                    color: "#555f6d",
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
                      color: "var(--avatar-theme-color, #0D47A1)",
                      background: "#ffffff",
                      border: "2px solid var(--avatar-theme-color, #0D47A1)",
                      borderRadius: "12px",
                      textDecoration: "none",
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--avatar-theme-color, #0D47A1)";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "var(--avatar-theme-color, #0D47A1)";
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
                      background: "var(--avatar-theme-color, #0D47A1)",
                      border: "2px solid var(--avatar-theme-color, #0D47A1)",
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

        {/* ΓöÇΓöÇ LIVE PLATFORM STATS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <section className="home-stats-section" style={{ background: "linear-gradient(180deg, #f1f3ff 0%, #ffffff 55%)", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
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
              ))}
            </div>
          </div>
        </section>

        {/* ΓöÇΓöÇ EXPLORE THE PLATFORM ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <section className="home-explore-section" style={{ background: "linear-gradient(180deg, #f5f6ff 0%, #fafaf8 60%)", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
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

        {/* ΓöÇΓöÇ BUILT FOR EVERY ROLE ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <section className="home-roles-section" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f1f3ff 100%)", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
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
                  <div className="home-card-lift home-role-card" style={{ background: "linear-gradient(160deg, #ffffff 0%, #f1f3ff 100%)", border: "1px solid rgba(79, 70, 229, 0.16)", boxShadow: "0 4px 14px rgba(67, 56, 202, 0.07)", borderRadius: "18px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "14px", cursor: "default", height: "100%", boxSizing: "border-box" }}>
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

        {/* ΓöÇΓöÇ FRESH FROM THE PLATFORM ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        {(latestResearch.length > 0 || latestArchive.length > 0) && (
          <section className="home-latest-section" style={{ background: "linear-gradient(180deg, #f5f6ff 0%, #fafaf8 60%)", padding: "clamp(76px, 9vw, 112px) 32px", borderTop: "1px solid #e4e4e7" }}>
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
                                {date && <><span>┬╖</span><Calendar size={10} /> {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>}
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

        {/* ΓöÇΓöÇ HOW IT WORKS (guests) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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

        {/* ΓöÇΓöÇ PARTNER NETWORK ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <section id="network-section" style={{ background: "var(--theme-sidebar-gradient)", padding: "80px 32px 72px" }} className="home-partner-section">
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "48px" }}>
              <div>
                <p style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", margin: "0 0 10px 0" }}>
                  Partnered Faculties
                </p>
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

        {/* ΓöÇΓöÇ FOOTER ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <footer style={{ background: "#f9f9ff", borderTop: "1px solid #dde0e6", position: "relative" }}>

          {/* Footer body ΓÇö 4 columns */}
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
                <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--avatar-theme-color, #141b2b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                  <p style={{ fontSize: "12.5px", color: "#555f6d", margin: 0 }}>
                    Built by <strong style={{ color: "#47464c" }}>Semicolon-Squad-DU</strong>
                  </p>
                </>
              )}
            </div>

            {/* Legal column */}
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--avatar-theme-color, #141b2b)", margin: "0 0 16px 0" }} className="footer-header-text">
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
                    onMouseEnter={e => e.currentTarget.style.color = "var(--avatar-theme-color, #0D47A1)"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                  >{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Team column */}
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--avatar-theme-color, #141b2b)", margin: "0 0 16px 0" }} className="footer-header-text">
                Team
              </p>
              <p style={{ fontSize: "13.5px", color: "#141b2b", margin: "0 0 10px 0", fontWeight: 700 }} className="footer-link-text">Semicolon-Squad-DU</p>
            </div>
          </div>

          {/* Footer bottom bar */}
          <div style={{ borderTop: "1px solid #e2e5ea" }}>
            <div style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: isMobile ? "16px 12px" : "16px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}>
              <p style={{ fontSize: "13px", color: "#555f6d", margin: 0 }}>
                ┬⌐ 2026 Digital Knowledge Platform. All rights reserved.
              </p>
            </div>
          </div>


          {/* Back to top button positioned absolutely on the far right of the grey footer band */}
          <div style={{ position: "absolute", right: isMobile ? "16px" : "32px", bottom: isMobile ? "64px" : "60px", zIndex: 10 }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                color: "var(--avatar-theme-color, #47464c)",
                background: "transparent",
                border: "1.5px solid #c8c5cd",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; e.currentTarget.style.background = "#ffffff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#c8c5cd"; e.currentTarget.style.background = "transparent"; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px", fontWeight: "bold" }}>arrow_upward</span>
            </button>
          </div>
        </footer>

      </div>
    </>
  );
}
