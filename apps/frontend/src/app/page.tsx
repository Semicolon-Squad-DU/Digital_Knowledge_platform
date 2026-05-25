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
  { label: "Browse Archive", href: "/archive", icon: Archive, bg: "#f0fdf4", color: "#16a34a", desc: "Search institutional documents" },
  { label: "Library Catalog", href: "/library", icon: BookOpen, bg: "#eff6ff", color: "#2563eb", desc: "Books, journals & more" },
  { label: "Research Repository", href: "/research", icon: FlaskConical, bg: "#fdf4ff", color: "#9333ea", desc: "Faculty publications & datasets" },
  { label: "Showcase Gallery", href: "/showcase", icon: Star, bg: "#fff7ed", color: "#ea580c", desc: "Student project highlights" },
];

const TYPEWRITER_HEADING = "Empowering Research, Learning & Innovation";
const TYPEWRITER_BODY = "Discover academic resources, explore student research projects, browse digital archives, and connect with university knowledge systems from a single intelligent platform.";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [headingText, setHeadingText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [phase, setPhase] = useState<"heading" | "body" | "done">("heading");

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
          setTimeout(() => setPhase("body"), 300);
        }
      }, 35);
    } else if (phase === "body") {
      timer = setInterval(() => {
        idx++;
        setBodyText(TYPEWRITER_BODY.slice(0, idx));
        if (idx >= TYPEWRITER_BODY.length) {
          clearInterval(timer);
          setPhase("done");
        }
      }, 18);
    } else if (phase === "done") {
      pauseTimer = setTimeout(() => {
        setHeadingText("");
        setBodyText("");
        setPhase("heading");
      }, 5000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(pauseTimer);
    };
  }, [phase]);

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

        {/* ── NAVBAR ── */}
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e9ecef", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.01em" }}>
              Digital Knowledge Platform
            </span>

            <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {[
                { label: "Archive", href: "/archive", protected: true },
                { label: "Library", href: "/library", protected: true },
                { label: "Research", href: "/research", protected: true },
                { label: "About", href: "/about", protected: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.protected && !isAuthenticated ? `/login?redirect=${item.href}` : item.href}
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, color: "#495057", textDecoration: "none", borderRadius: "6px" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f1f3f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >{item.label}</Link>
              ))}
            </nav>

            {/* ── AUTH AREA: different for guest vs signed-in ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated ? (
                <>
                  {/* Signed-in: show avatar + name + dashboard + sign out */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e9ecef", background: "#f8f9fa" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.name?.split(" ")[0]}
                    </span>
                  </div>
                  <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: "13px", fontWeight: 600, color: "#fff", background: "#1a1a2e", borderRadius: "6px", textDecoration: "none" }}>
                    <LayoutDashboard size={13} /> Dashboard
                  </Link>
                  <button onClick={handleLogout} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: "13px", fontWeight: 500, color: "#6b7280", background: "transparent", border: "1px solid #e9ecef", borderRadius: "6px", cursor: "pointer" }}>
                    <LogOut size={13} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Guest: sign in + register */}
                  <Link href="/login" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 500, color: "#495057", textDecoration: "none", borderRadius: "6px", border: "1px solid #dee2e6", background: "#ffffff" }}>
                    Sign In
                  </Link>
                  <Link href="/register" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, color: "#ffffff", background: "#1a1a2e", borderRadius: "6px", textDecoration: "none" }}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── HERO: different for guest vs signed-in ── */}
        <section style={{ background: "#ffffff", padding: isAuthenticated ? "40px 32px 72px" : "20px 32px 0", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: isAuthenticated ? "400px" : "1400px", width: "100%", margin: "0 auto", textAlign: isAuthenticated ? "center" : "left", display: isAuthenticated ? "block" : "flex", flexDirection: "column" }}>
            {isAuthenticated ? (
              /* ── SIGNED-IN HERO ── */
              <>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                  WELCOME BACK
                </p>
                <h1 style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 800, color: "#111827", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
                  {user?.name?.split(" ")[0]}, your research workspace is ready.
                </h1>
                <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 48px" }}>
                  {user?.department ? `${user.department} · ` : ""}
                  <span style={{ textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</span>
                  {" "}— pick up where you left off.
                </p>
                {/* Quick access grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, maxWidth: 700, margin: "0 auto 40px", textAlign: "left" }}>
                  {QUICK_LINKS.map(ql => (
                    <Link key={ql.href} href={ql.href} style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: 16, 
                      padding: "32px 28px", 
                      borderRadius: 12, 
                      background: ql.bg, 
                      textDecoration: "none", 
                      border: `2px solid transparent`,
                      transition: "all 0.2s"
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = ql.color;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: ql.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <ql.icon size={24} style={{ color: "#fff" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: ql.color, margin: "0 0 6px 0" }}>{ql.label}</p>
                        <p style={{ fontSize: 14, color: ql.color, margin: 0, opacity: 0.8 }}>{ql.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/dashboard" style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "14px 32px", 
                  fontSize: "15px", 
                  fontWeight: 600, 
                  color: "#fff", 
                  background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)", 
                  borderRadius: "10px", 
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                >
                  Go to Dashboard
                  <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              /* ── GUEST HERO ── */
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 10 }}>
                  <h1 style={{
                    fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                    fontWeight: 500,
                    color: "#000",
                    lineHeight: 1.1,
                    letterSpacing: "-0.04em",
                    margin: 0,
                    textTransform: "uppercase",
                    wordBreak: "break-word",
                    flex: "1 1 min-content"
                  }}>
                    The Digital<br />Knowledge Platform
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
                      color: "#000",
                      flexShrink: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: 500 }}>Scroll down</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_downward</span>
                  </button>
                </div>

                <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "-15%", position: "relative", alignItems: "flex-end", overflow: "hidden", zIndex: 0 }}>
                  <img src="/hero-graphic.png" alt="Platform Graphic" style={{ width: "100%", maxWidth: "1000px", objectFit: "contain", zIndex: 1, position: "relative", paddingBottom: "2px", mixBlendMode: "multiply" }} />

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
                    color: "#1a1a2e",
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
                        background: "#1a1a2e",
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
            )}
          </div>
        </section>

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section id="network-section" style={{ background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)", padding: "72px 32px" }}>
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
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.55, margin: "0 0 6px" }}>
                Digital Knowledge Platform
              </p>
              <p style={{ fontSize: "12px", color: "#6c757d", margin: 0 }}>
                © 2026 Digital Knowledge Platform. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", gap: "24px" }}>
                {["Privacy Policy", "Terms of Service", "Contact Us"].map((l) => (
                  <Link key={l} href="#" style={{ fontSize: "13px", color: "#495057", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {l}
                  </Link>
                ))}
              </div>
              <Link href="#" style={{ fontSize: "13px", color: "#495057", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
               
              </Link>
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
