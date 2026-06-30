"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Archive, BookOpen, FlaskConical, Star, LogOut, LayoutDashboard, ArrowRight, GraduationCap, Menu, X } from "lucide-react";

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



const QUICK_LINKS = [
  { label: "Browse Archive", href: "/archive", icon: Archive, bg: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)", color: "#ffffff", desc: "Search institutional documents" },
  { label: "Library Catalog", href: "/library", icon: BookOpen, bg: "linear-gradient(135deg, #3a3a3a 0%, #1f1f1f 100%)", color: "#ffffff", desc: "Books, journals & more" },
  { label: "Research Repository", href: "/research", icon: FlaskConical, bg: "linear-gradient(135deg, #2f2f2f 0%, #1a1a1a 100%)", color: "#ffffff", desc: "Faculty publications & datasets" },
  { label: "Showcase Gallery", href: "/showcase", icon: Star, bg: "linear-gradient(135deg, #353535 0%, #1e1e1e 100%)", color: "#ffffff", desc: "Student project highlights" },
];

const TYPEWRITER_HEADING = "Empowering Research, Learning & Innovation";
const TYPEWRITER_BODY = "Discover academic resources, explore student research projects, browse digital archives, and connect with university knowledge systems from a single intelligent platform.";

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
        @media (max-width: 768px) {
          .home-partner-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .home-footer { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .home-footer { grid-template-columns: 1fr !important; }
        }
      `}} />

      <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>

        <header style={{ background: "#eaecef", borderBottom: "1px solid #d1d5db", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 50, transform: isMobile && !headerVisible ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.35s ease" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px" }}>

            {/* Logo — always visible */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={16} color="#ffffff" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.02em" }}>DKP</span>
            </div>

            {isMobile ? (
              /* ── MOBILE: hamburger only ── */
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "8px", color: "#111827", borderRadius: "6px" }}
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            ) : (
              /* ── DESKTOP: nav links + auth ── */
              <>
                <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                      onMouseEnter={e => { e.currentTarget.style.background = "#d1d5db"; e.currentTarget.style.color = "#111827"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
                    >{item.label}</Link>
                  ))}
                </nav>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: "170px" }}>
                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", fontSize: "13px", fontWeight: 500, color: "#4b5563", background: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.01em", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Full-screen mobile menu */}
        {sidebarOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#eaecef", zIndex: 200, display: "flex", flexDirection: "column" }}>
            {/* Top bar — same bg as navbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "48px", borderBottom: "1px solid #d1d5db", flexShrink: 0 }}>
              <Link href="/" onClick={handleCloseSidebar} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={16} color="#ffffff" />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>DKP</span>
              </Link>
              <button onClick={handleCloseSidebar} aria-label="Close menu" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "#111827", display: "flex", alignItems: "center" }}>
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Nav links */}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
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
                  style={{ display: "block", padding: "10px 14px", fontSize: "13.5px", fontWeight: 500, color: "#111827", textDecoration: "none", borderRadius: "6px", letterSpacing: "0.01em", background: "transparent" }}
                >{item.label}</Link>
              ))}
            </div>
          </div>
        )}


        {/* ── GUEST HERO ── */}
        {!isAuthenticated && (
        <section style={{ background: "#ffffff", padding: "20px 32px 0", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 10 }}>
                <h1 style={{
                  fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%), var(--avatar-theme-color)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                  lineHeight: 1.1,
                  letterSpacing: "-0.05em",
                  wordSpacing: "0.3em",
                  margin: 0,
                  textTransform: "uppercase",
                  wordBreak: "break-word",
                }}>
                  The  Digital<br />Knowledge  Platform
                </h1>
                <button
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
                    gap: "6px",
                    marginTop: "12px",
                    color: "var(--avatar-theme-color, #000)",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.75)",
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    borderRadius: "100px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    backdropFilter: "blur(4px)",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                  }}
                >
                  <span>Scroll down</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_downward</span>
                </button>
              </div>

              <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "-15%", position: "relative", alignItems: "flex-end", overflow: "hidden", zIndex: 0 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "1000px", zIndex: 1 }}>
                  <img src="/hero-graphic.png" alt="Platform Graphic" style={{ width: "100%", objectFit: "contain", display: "block", mixBlendMode: "multiply", opacity: 0.9 }} />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    mixBlendMode: "color",
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
                  margin: "0 0 18px",
                  minHeight: "2.3em",
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

        {/* ── AUTH CARD - Sign In & Register (For Guests) ── */}
        {!isAuthenticated && (
          <section style={{ background: "linear-gradient(160deg, #f4f6ff 0%, #ffffff 60%)", padding: "72px 32px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>
                <div style={{ textAlign: "center", maxWidth: "560px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--avatar-theme-color)", margin: "0 0 14px 0", opacity: 0.8 }}>
                    Get Started Today
                  </p>
                  <h2 style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                    fontWeight: 800,
                    color: "#0f1117",
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

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
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
              <div className="dkp-stats-row">
                {[
                  { value: "8", label: "Departments" },
                  { value: "FET", label: "Faculty" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>{s.value}</p>
                    <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.65)", margin: "2px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</p>
                  </div>
                ))}
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
                    alignSelf: "flex-start",
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
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    {p.full}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer style={{ background: "#f0f2f5", borderTop: "1px solid #dde0e6" }}>

          {/* Footer body — 4 columns */}
          <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 32px 40px",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "40px",
          }} className="home-footer">

            {/* Brand column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap size={14} color="#ffffff" />
                </div>
                <span style={{ fontSize: "15.5px", fontWeight: 800, color: "var(--avatar-theme-color)", letterSpacing: "-0.025em" }}>
                  Digital Knowledge Platform
                </span>
              </div>
              <p style={{ fontSize: "13.5px", color: "#4b5563", margin: "0 0 16px 0", lineHeight: 1.7, maxWidth: "280px" }}>
                A unified academic knowledge system for archives, research, and library resources at the University of Dhaka.
              </p>
              <p style={{ fontSize: "12.5px", color: "#6b7280", margin: 0 }}>
                Built by <strong style={{ color: "#374151" }}>Semicolon-Squad-DU</strong>
              </p>
            </div>

            {/* Legal column */}
            <div>
              <p style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 16px 0" }}>
                Legal
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact Us", href: "/contact" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    style={{ fontSize: "14px", color: "#374151", textDecoration: "none", fontWeight: 500, transition: "color 0.18s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                  >{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Team column */}
            <div>
              <p style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 16px 0" }}>
                Team
              </p>
              <p style={{ fontSize: "13.5px", color: "#1f2937", margin: "0 0 10px 0", fontWeight: 700 }}>Semicolon-Squad-DU</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {["Faria Yasmin", "Yuki Bhuiyan", "Nuruzzaman", "Hasibul Islam"].map(name => (
                  <p key={name} style={{ fontSize: "13.5px", color: "#4b5563", margin: 0 }}>{name}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Footer bottom bar */}
          <div style={{ borderTop: "1px solid #e2e5ea" }}>
            <div style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "16px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                © 2026 Digital Knowledge Platform. All rights reserved.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--avatar-theme-color, #374151)",
                  background: "transparent",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; e.currentTarget.style.background = "#ffffff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "transparent"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_upward</span>
                Back to top
              </button>
            </div>
          </div>

        </footer>

      </div>
    </>
  );
}
