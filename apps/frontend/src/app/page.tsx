"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Archive, BookOpen, FlaskConical, Star, LogOut, LayoutDashboard, ArrowRight, GraduationCap, Menu, X } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);

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

  // Handle sidebar scroll behavior - removed for bottom sheet style
  useEffect(() => {
    if (sidebarOpen) {
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when sidebar closes
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [sidebarOpen]);

  // Handle sidebar closing animation
  const handleCloseSidebar = () => {
    setSidebarClosing(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setSidebarClosing(false);
    }, 600); // Match animation duration
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUpFromBottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDownToBottom { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .home-partner-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              {/* Hamburger Menu Button (Mobile) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  display: "none",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  color: "#4b5563",
                  transition: "all 0.2s"
                }}
                className="header-hamburger-btn"
                title="Menu"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

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
              ) : null}

              {/* Mobile Sidebar */}
              {sidebarOpen && (
                <>
                  {/* Overlay */}
                  <div
                    onClick={handleCloseSidebar}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0, 0, 0, 0.5)",
                      zIndex: 999,
                      animation: sidebarClosing ? "fadeOut 0.6s ease-in" : "fadeIn 0.6s ease-out"
                    }}
                  />

                  {/* Sidebar Panel - Bottom Sheet Style */}
                  <div
                    style={{
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "70vh",
                      background: "#e8eaed",
                      boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                      display: "flex",
                      flexDirection: "column",
                      animation: sidebarClosing ? "slideDownToBottom 0.6s ease-in" : "slideUpFromBottom 0.6s ease-out",
                      overflowY: "auto",
                      borderRadius: "20px 20px 0 0"
                    }}
                  >
                    {/* Sidebar Header */}
                    <div style={{
                      padding: "16px 20px",
                      borderBottom: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#e8eaed"
                    }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--avatar-theme-color)"
                      }}>
                        Menu
                      </span>
                      <button
                        onClick={handleCloseSidebar}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#4b5563"
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Navigation Links */}
                    <div style={{ padding: "12px 0", borderBottom: "none", background: "#ffffff" }}>
                      {[
                        { label: "Archive", href: "/archive", protected: false },
                        { label: "Library", href: "/library", protected: true },
                        { label: "Research", href: "/research", protected: true },
                        { label: "About", href: "/about", protected: false },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.protected && !isAuthenticated ? `/login?redirect=${item.href}` : item.href}
                          onClick={handleCloseSidebar}
                          style={{
                            display: "block",
                            padding: "14px 20px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#4b5563",
                            textDecoration: "none",
                            transition: "all 0.2s",
                            borderLeft: "3px solid transparent",
                            borderBottom: "1px solid #f0f0f0"
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.borderLeftColor = "var(--avatar-theme-color)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderLeftColor = "transparent";
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Auth Section */}
                    <div style={{ padding: "12px 0", flex: 1, background: "#ffffff" }}>
                      {isAuthenticated ? (
                        <>
                          <Link
                            href="/dashboard"
                            onClick={handleCloseSidebar}
                            style={{
                              display: "block",
                              padding: "14px 20px",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "var(--avatar-theme-color)",
                              textDecoration: "none",
                              transition: "all 0.2s",
                              borderLeft: "3px solid transparent",
                              borderBottom: "1px solid #f0f0f0"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.borderLeftColor = "var(--avatar-theme-color)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderLeftColor = "transparent";
                            }}
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={() => { router.push("/profile"); handleCloseSidebar(); }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "14px 20px",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#4b5563",
                              background: "transparent",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              borderLeft: "3px solid transparent",
                              borderBottom: "1px solid #f0f0f0"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.borderLeftColor = "var(--avatar-theme-color)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderLeftColor = "transparent";
                            }}
                          >
                            Profile
                          </button>
                        </>
                      ) : null}
                    </div>

                    {/* Sign Out Button (for authenticated users) */}
                    {isAuthenticated && (
                      <div style={{ padding: "12px 0", borderTop: "1px solid #f0f0f0", background: "#ffffff" }}>
                        <button
                          onClick={() => { handleCloseSidebar(); handleLogout(); }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "14px 20px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#dc2626",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            borderLeft: "3px solid transparent"
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.borderLeftColor = "#dc2626";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderLeftColor = "transparent";
                          }}
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
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

        {/* ── AUTH CARD - Sign In & Register (For Guests) ── */}
        {!isAuthenticated && (
          <section style={{ background: "#ffffff", padding: "60px 32px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
                <div style={{ textAlign: "center", maxWidth: "600px" }}>
                  <h2 style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontWeight: 800,
                    color: "#111827",
                    margin: "0 0 12px 0",
                    letterSpacing: "-0.02em"
                  }}>
                    Ready to Join Us?
                  </h2>
                  <p style={{
                    fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                    color: "#6b7280",
                    lineHeight: 1.6,
                    margin: 0
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
                      padding: "14px 32px",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--avatar-theme-color, #1a56db)",
                      background: "#ffffff",
                      border: "2px solid var(--avatar-theme-color, #1a56db)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--avatar-theme-color, #1a56db)";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(26, 86, 219, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
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
                      padding: "14px 32px",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#ffffff",
                      background: "var(--avatar-theme-color, #1a56db)",
                      border: "2px solid var(--avatar-theme-color, #1a56db)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(26, 86, 219, 0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(26, 86, 219, 0.9)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(26, 86, 219, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--avatar-theme-color, #1a56db)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 86, 219, 0.3)";
                    }}
                  >
                    <span>Sign Up</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section id="network-section" style={{ background: "var(--theme-sidebar-gradient)", padding: "72px 32px" }} className="home-partner-section">
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }} className="home-partner-grid">
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
                  className="home-partner-item"
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
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
          }} className="home-footer">
            {/* Brand */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--avatar-theme-color)", lineHeight: 1.55, margin: "0 0 6px" }}>
                Digital Knowledge Platform
              </p>
              <p style={{ fontSize: "12px", color: "#6c757d", margin: "0 0 8px 0" }}>
                © 2026 Digital Knowledge Platform. All rights reserved.
              </p>
              <p style={{ fontSize: "12px", color: "#6c757d", margin: 0 }}>
                Built by <strong>Semicolon-Squad-DU</strong>
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "12px", margin: "0 0 12px 0" }}>
                Resources
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact Us", href: "/contact" }
                ].map((l) => (
                  <Link key={l.label} href={l.href} style={{ fontSize: "12px", color: "#495057", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#495057")}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Team */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "12px", margin: "0 0 12px 0" }}>
                Team
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "12px", color: "#6c757d", margin: 0, fontWeight: 600 }}>Semicolon-Squad-DU</p>
                <div style={{ fontSize: "11px", color: "#6c757d" }}>
                  <p style={{ margin: "4px 0" }}>Faria Yasmin</p>
                  <p style={{ margin: "4px 0" }}>Yuki Bhuiyan</p>
                  <p style={{ margin: "4px 0" }}>Nuruzzaman</p>
                  <p style={{ margin: "4px 0" }}>Hasibul Islam</p>
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
