"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Archive, BookOpen, FlaskConical, Star, LogOut, LayoutDashboard } from "lucide-react";

const PARTNERS = [
  { id: 1, name: "MIT" }, { id: 2, name: "Oxford" }, { id: 3, name: "Stanford" },
  { id: 4, name: "ETH" }, { id: 5, name: "NUS" }, { id: 6, name: "BUET" },
  { id: 7, name: "Harvard" }, { id: 8, name: "Cambridge" },
];

const FEATURES = [
  { icon: "auto_awesome", title: "Intelligent Discovery", desc: "Our AI-driven taxonomy engine maps relationships between disparate data sets to reveal hidden insights." },
  { icon: "security", title: "Secure Collaboration", desc: "Encrypted workspaces allow institutional teams to collaborate on sensitive research with granular permissions." },
  { icon: "database", title: "Metadata Enrichment", desc: "Automatic cross-referencing and citation generation for all uploaded materials." },
];

const QUICK_LINKS = [
  { label: "Browse Archive", href: "/archive", icon: Archive, bg: "#f0fdf4", color: "#16a34a", desc: "Search institutional documents" },
  { label: "Library Catalog", href: "/library", icon: BookOpen, bg: "#eff6ff", color: "#2563eb", desc: "Books, journals & more" },
  { label: "Research Repository", href: "/research", icon: FlaskConical, bg: "#fdf4ff", color: "#9333ea", desc: "Faculty publications & datasets" },
  { label: "Showcase Gallery", href: "/showcase", icon: Star, bg: "#fff7ed", color: "#ea580c", desc: "Student project highlights" },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
      `}</style>

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
                { label: "About", href: "/", protected: false },
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
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  Welcome back
                </p>
                <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
                  {user?.name?.split(" ")[0]}, your research workspace is ready.
                </h1>
                <p style={{ fontSize: "15px", color: "#6c757d", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}>
                  {user?.department ? `${user.department} · ` : ""}
                  <span style={{ textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</span>
                  {" "}— pick up where you left off.
                </p>
                {/* Quick access grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, maxWidth: 520, margin: "0 auto 32px", textAlign: "left" }}>
                  {QUICK_LINKS.map(ql => (
                    <Link key={ql.href} href={ql.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: ql.bg, textDecoration: "none", border: `1px solid ${ql.bg}` }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      <ql.icon size={18} style={{ color: ql.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: ql.color, margin: 0 }}>{ql.label}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{ql.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 28px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#1a1a2e", borderRadius: "8px", textDecoration: "none" }}>
                  Go to Dashboard →
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
              </div>
            )}
          </div>
        </section>

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section id="network-section" style={{ background: "#f8f9fa", padding: "72px 32px", borderTop: "1px solid #e9ecef" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", marginBottom: "6px" }}>
                  Our Network
                </h2>
                <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>
                  Powering Research for the World&apos;s Leading Institutions
                </p>
              </div>
              <Link
                href="/institutions"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1a1a2e",
                  textDecoration: "none",
                  padding: "8px 16px",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  background: "#ffffff",
                }}
              >
                View all partners
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
              </Link>
            </div>

            {/* Partner logo grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {PARTNERS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e9ecef",
                    borderRadius: "10px",
                    padding: "28px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "80px",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#adb5bd", letterSpacing: "0.05em" }}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────────── */}
        <section style={{ background: "#ffffff", padding: "80px 32px", borderTop: "1px solid #e9ecef" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "52px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>
                Designed for the Modern Scholar
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px" }}>
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    padding: "32px 28px",
                  }}
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    background: "#1a1a2e",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#ffffff" }}>
                      {f.icon}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", marginBottom: "10px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#6c757d", lineHeight: 1.65, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER — only shown to guests ── */}
        {!isAuthenticated && (
          <section style={{ background: "#1a1a2e", padding: "80px 32px" }}>
            <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.25, marginBottom: "16px" }}>
                Secure Your Access to the Future of Research
              </h2>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "36px" }}>
                Join over 400 global institutions currently leveraging our platform for data-driven academic advancement.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/register?type=institution" style={{ padding: "12px 28px", fontSize: "14px", fontWeight: 600, color: "#1a1a2e", background: "#ffffff", borderRadius: "8px", textDecoration: "none", border: "2px solid #ffffff" }}>
                  Request Institutional Access
                </Link>
                <Link href="/register" style={{ padding: "12px 28px", fontSize: "14px", fontWeight: 600, color: "#ffffff", background: "transparent", borderRadius: "8px", textDecoration: "none", border: "2px solid rgba(255,255,255,0.4)" }}>
                  Individual Signup
                </Link>
              </div>
            </div>
          </section>
        )}

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
                {["Privacy Policy", "Terms of Service", "Institutional Access"].map((l) => (
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
                Contact Support
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
