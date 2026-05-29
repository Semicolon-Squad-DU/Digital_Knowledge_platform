"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Archive, BookOpen, FlaskConical, Star, LogOut, LayoutDashboard, ArrowRight, GraduationCap } from "lucide-react";

const PARTNERS = [
  { id: 1, name: "CSE" }, { id: 2, name: "EEE" }, { id: 3, name: "IIT" },
  { id: 4, name: "RME" }, { id: 5, name: "GEB" }, { id: 6, name: "PHR" },
  { id: 7, name: "NE" }, { id: 8, name: "ACCE" },
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

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}} />

      <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>

        <header style={{ background: "#e8eaed", borderBottom: "1px solid #d1d5db", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.01em", transition: "color 0.3s ease" }}>
              Digital Knowledge Platform
            </span>

            <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {[
                { label: "Archive", href: "/archive", protected: false },
                { label: "Library", href: "/library", protected: true },
                { label: "Research", href: "/research", protected: true },
                { label: "About", href: "/about", protected: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.protected && !isAuthenticated ? `/login?redirect=${item.href}` : item.href}
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 700, color: "#4b5563", textDecoration: "none", borderRadius: "6px", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#d1d5db"; e.currentTarget.style.color = "#111827"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
                >{item.label}</Link>
              ))}
            </nav>

            {/* ── AUTH AREA: different for guest vs signed-in ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isAuthenticated ? (
                <>
                  {/* Signed-in: show avatar circle + sign out */}
                  {/* Dashboard button for logged in users */}
                  <Link
                    href="/dashboard"
                    style={{
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#ffffff",
                      background: "var(--avatar-theme-color)",
                      borderRadius: "6px",
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--avatar-theme-color)"; e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--avatar-theme-color)"; e.currentTarget.style.opacity = "1"; }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => router.push("/profile")}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#111827",
                      border: "2px solid #d1d5db",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      outline: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="View Profile"
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#4b5563",
                      background: "transparent",
                      border: "1px solid #dee2e6",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "#dee2e6"; }}
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Guest: sign in + register */}
                  <Link
                    href="/login"
                    style={{
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#495057",
                      textDecoration: "none",
                      borderRadius: "6px",
                      border: "1px solid #dee2e6",
                      background: "#ffffff",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#ffffff",
                      background: "var(--avatar-theme-color)",
                      borderRadius: "6px",
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--avatar-theme-color)"; e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--avatar-theme-color)"; e.currentTarget.style.opacity = "1"; }}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── GUEST HERO ── */}
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
                  flex: "1 1 min-content"
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
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "color 0.3s ease"
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 500 }}>Scroll down</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_downward</span>
                </button>
              </div>

              <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "-15%", position: "relative", alignItems: "flex-end", overflow: "hidden", zIndex: 0 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "1000px", zIndex: 1 }}>
                  <img src="/hero-graphic.png" alt="Platform Graphic" style={{ width: "100%", objectFit: "contain", display: "block", mixBlendMode: "multiply" }} />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "var(--avatar-theme-color)",
                    mixBlendMode: "color",
                    zIndex: 2,
                    pointerEvents: "none",
                    opacity: 0.8
                  }} />
                </div>

                {/* Horizontal line behind the graphic, stretching full width */}
                <div style={{ position: "absolute", bottom: "2px", left: "-5vw", right: "-5vw", height: "3px", background: "#000", zIndex: 0 }}></div>
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
                  fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                  fontWeight: 700,
                  color: "var(--avatar-theme-color)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.02em",
                  margin: "0 0 16px",
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
                  fontSize: "clamp(0.875rem, 1.4vw, 1.05rem)",
                  color: "#495057",
                  lineHeight: 1.75,
                  margin: 0,
                  minHeight: "4.5em",
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

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section id="network-section" style={{ background: "var(--theme-sidebar-gradient)", padding: "72px 32px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
                Our Faculty Network
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                Powering Innovation and Engineering Research at the University of Dhaka
              </p>
            </div>

            {/* Partner logo grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {PARTNERS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: "10px",
                    padding: "28px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "80px",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <footer style={{ background: "#f1f3f5", borderTop: "1px solid #dee2e6" }}>
          <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "32px 32px",
            display: "grid",
            gridTemplateColumns: "200px 1fr auto",
            alignItems: "start",
            gap: "32px",
          }}>
            {/* Brand */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--avatar-theme-color)", lineHeight: 1.55, margin: "0 0 6px" }}>
                Digital Knowledge Platform
              </p>
              <p style={{ fontSize: "12px", color: "#6c757d", margin: 0 }}>
                © 2026 Digital Knowledge Platform. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", gap: "24px" }}>
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact Us", href: "/contact" }
                ].map((l) => (
                  <Link key={l.label} href={l.href} style={{ fontSize: "13px", color: "#495057", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Globe icons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#adb5bd" }}>language</span>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#adb5bd" }}>public</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
