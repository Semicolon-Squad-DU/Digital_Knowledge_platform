"use client";

import { useState } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Archive, BookOpen, FlaskConical, Star, Users, Target, Lightbulb, ArrowRight, GraduationCap, X, Menu, UserRound } from "lucide-react";

const ABOUT_NAV = [
  { label: "Archive",  href: "/archive"  },
  { label: "Library",  href: "/library"  },
  { label: "Research", href: "/research" },
  { label: "Showcase", href: "/showcase" },
  { label: "About",    href: "/about"    },
];

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}} />

      <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "var(--color-canvas-default)", color: "var(--color-fg-default)", minHeight: "100vh" }}>

        {/* ── NAVBAR ── */}
        <header style={{ background: isMobile ? "#ffffff" : "rgba(255,255,255,0.1)", backdropFilter: isMobile ? "none" : "blur(10px)", borderBottom: "1px solid " + (isMobile ? "#e5e7eb" : "rgba(255,255,255,0.2)"), boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.05)" : "0 1px 4px rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 50, padding: isMobile ? "12px 16px" : "10px 0" }}>
          <div style={{ maxWidth: isMobile ? "100%" : "80%", margin: "0 auto", padding: isMobile ? "0" : "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: isMobile ? "48px" : "48px" }}>
            {/* Brand / mobile group */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isMobile && (
                <button
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: isMobile ? "#111827" : "var(--color-fg-default)", marginLeft: "-6px" }}
                >
                  <Menu size={20} />
                </button>
              )}
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: isMobile ? "#111827" : "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap size={14} color="#ffffff" />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: isMobile ? "#111827" : "var(--color-fg-default)", letterSpacing: "-0.02em" }}>DKP</span>
              </Link>
            </div>

            {!isMobile && (
              /* Desktop: nav + auth */
              <>
                <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {ABOUT_NAV.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{ padding: "6px 14px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-fg-muted)", textDecoration: "none", borderRadius: "6px", letterSpacing: "0.01em", transition: "all 0.2s", background: item.href === "/about" ? "var(--color-border-default)" : "transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border-default)"; e.currentTarget.style.color = "var(--color-fg-default)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = item.href === "/about" ? "var(--color-border-default)" : "transparent"; e.currentTarget.style.color = "var(--color-fg-muted)"; }}
                    >{item.label}</Link>
                  ))}
                </nav>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Link href="/login" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 500, color: "var(--color-fg-muted)", textDecoration: "none", borderRadius: "8px", border: "1.5px solid var(--color-border-default)", background: "transparent", letterSpacing: "0.01em" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border-default)"; e.currentTarget.style.color = "var(--color-fg-default)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-fg-muted)"; }}>Sign In</Link>
                  <Link href="/register" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, color: "var(--color-fg-on-emphasis)", background: "var(--avatar-theme-color, #111827)", borderRadius: "8px", textDecoration: "none", letterSpacing: "0.01em" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>Register</Link>
                </div>
              </>
            )}
          </div>
        </header>

 
        {/* Full-screen mobile menu */}
        {menuOpen && (
          <>
            {/* Backdrop / Overlay */}
            <div
              onClick={() => setMenuOpen(false)}
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
                <Link href="/" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <GraduationCap size={16} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>DKP</span>
                </Link>
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center" }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Guest User Info */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--avatar-theme-color, #111827)", boxShadow: "0 4px 12px rgba(0,0,0,0.24)" }}>
                  <UserRound size={32} />
                </div>
                <div>
                  <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Guest User</p>
                  <span style={{ fontSize: "11px", color: "#f87171", background: "rgba(239, 68, 68, 0.2)", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>Guest Mode</span>
                </div>
              </div>

              {/* Nav links */}
              <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
                {ABOUT_NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
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

              {/* Auth Buttons */}
              <div style={{ padding: "12px 16px 20px 16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.15)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      width: "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10.5px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                      background: "rgba(255,255,255,0.12)",
                      border: "1.5px solid rgba(255,255,255,0.25)",
                      borderRadius: "8px",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      letterSpacing: "0.01em"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#ffffff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      width: "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10.5px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "var(--avatar-theme-color, #111827)",
                      background: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      letterSpacing: "0.01em"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── HERO SECTION ── */}
        <section style={{ background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", padding: "80px 32px", color: "#ffffff", transition: "background 0.3s ease" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.02em", color: "#ffffff" }}>
              About Digital Knowledge Platform
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "700px", margin: "0 auto" }}>
              Empowering the University of Dhaka through unified access to institutional knowledge, faculty research, and academic excellence.
            </p>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section style={{ padding: "80px 32px", background: "var(--color-canvas-default)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
              {/* Mission */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, var(--color-canvas-subtle))", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
                    <Target size={28} style={{ color: "var(--avatar-theme-color, #1a1a2e)", transition: "color 0.3s ease" }} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-fg-default)", margin: 0, transition: "color 0.3s ease" }}>Our Mission</h2>
                </div>
                <p style={{ fontSize: "15px", color: "var(--color-fg-muted)", lineHeight: 1.8, margin: 0 }}>
                 To develop a centralized platform that provides seamless access to library resources, research archives, and student projects while promoting knowledge sharing, academic collaboration, and efficient management of institutional data for students, researchers, and educators.
                </p>
              </div>

              {/* Vision */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, var(--color-canvas-subtle))", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
                    <Lightbulb size={28} style={{ color: "var(--avatar-theme-color, #1a1a2e)", transition: "color 0.3s ease" }} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-fg-default)", margin: 0, transition: "color 0.3s ease" }}>Our Vision</h2>
                </div>
                <p style={{ fontSize: "15px", color: "var(--color-fg-muted)", lineHeight: 1.8, margin: 0 }}>
                 To create a unified digital knowledge ecosystem that transforms how academic institutions preserve, access, and share knowledge, enabling innovation, collaboration, and research excellence across all disciplines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CORE FEATURES ── */}
        <section style={{ padding: "80px 32px", background: "var(--color-canvas-subtle)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-fg-default)", marginBottom: "12px", transition: "color 0.3s ease" }}>
                Core Features
              </h2>
              <p style={{ fontSize: "16px", color: "var(--color-fg-muted)" }}>
                Comprehensive tools designed to support academic excellence
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
              {[
                { icon: Archive, label: "Digital Archive", desc: "Browse institutional documents, records, and historical collections" },
                { icon: BookOpen, label: "Library Catalog", desc: "Access books, journals, research papers, and academic publications" },
                { icon: FlaskConical, label: "Research Hub", desc: "Discover faculty publications, datasets, and ongoing research projects" },
                { icon: Star, label: "Student Showcase", desc: "Celebrate exceptional student projects and academic achievements" },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <feature.icon size={28} style={{ color: "#ffffff" }} />
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "8px" }}>
                    {feature.label}
                  </h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section style={{ padding: "80px 32px", background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", color: "#ffffff", textAlign: "center", transition: "background 0.3s ease" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "20px", color: "#ffffff" }}>
              Ready to Explore?
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "40px" }}>
              Join thousands of students, faculty, and researchers accessing the Digital Knowledge Platform.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  background: "#ffffff",
                  color: "var(--avatar-theme-color, #1a1a2e)",
                  fontWeight: 600,
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "15px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link
                href="/archive"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontWeight: 600,
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "15px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                Browse Archive <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: "var(--color-canvas-subtle)", borderTop: "1px solid var(--color-border-default)", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <p style={{ fontSize: "14px", color: "var(--color-fg-muted)", margin: 0 }}>
              © 2026 Digital Knowledge Platform | University of Dhaka. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
