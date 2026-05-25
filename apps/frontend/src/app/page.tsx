"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

// ── Partner logos (placeholder initials) ─────────────────────────────────────
const PARTNERS = [
  { id: 1, name: "MIT" },
  { id: 2, name: "Oxford" },
  { id: 3, name: "Stanford" },
  { id: 4, name: "ETH" },
  { id: 5, name: "NUS" },
  { id: 6, name: "BUET" },
  { id: 7, name: "Harvard" },
  { id: 8, name: "Cambridge" },
];

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "auto_awesome",
    title: "Intelligent Discovery",
    desc: "Our AI-driven taxonomy engine maps relationships between disparate data sets to reveal hidden insights.",
  },
  {
    icon: "security",
    title: "Secure Collaboration",
    desc: "Encrypted workspaces allow institutional teams to collaborate on sensitive research with granular permissions.",
  },
  {
    icon: "database",
    title: "Metadata Enrichment",
    desc: "Automatic cross-referencing and citation generation for all uploaded materials.",
  },
];

// ── Value props ───────────────────────────────────────────────────────────────
const VALUE_PROPS = [
  {
    icon: "verified_user",
    title: "Scholarly Integrity",
    desc: "Every contribution is rigorously verified by our double-blind peer review framework ensuring the highest academic standards.",
  },
  {
    icon: "inventory_2",
    title: "End-to-End Archiving",
    desc: "Permanent digital object identifiers (DOIs) and redundant storage protocols guarantee access for future generations.",
  },
  {
    icon: "account_balance",
    title: "Global Access",
    desc: "A decentralized network of institutional nodes providing seamless cross-border data portability for researchers.",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {/* Load Material Symbols */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>

        {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e9ecef", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
            {/* Logo */}
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.01em" }}>
              Digital Knowledge Platform
            </span>

            {/* Nav links */}
            <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {["Collections", "Institutions", "Research", "About"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#495057",
                    textDecoration: "none",
                    borderRadius: "6px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  style={{
                    padding: "7px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ffffff",
                    background: "#1a1a2e",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
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
                    }}
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
                      background: "#1a1a2e",
                      borderRadius: "6px",
                      textDecoration: "none",
                    }}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section style={{ background: "#ffffff", padding: "96px 32px 80px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <h1 style={{
              fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
              fontWeight: 700,
              color: "#1a1a2e",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
            }}>
              Advancing Global Research through Structured Intelligence
            </h1>
            <p style={{ fontSize: "16px", color: "#6c757d", lineHeight: 1.7, maxWidth: "580px", margin: "0 auto 36px" }}>
              A curated ecosystem for scholarly preservation, connecting world-class institutions with verified knowledge repositories.
            </p>

            {/* Search bar */}
            <div style={{ display: "flex", maxWidth: "520px", margin: "0 auto 48px", gap: "0" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: "#adb5bd" }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 44px",
                    fontSize: "14px",
                    border: "1px solid #dee2e6",
                    borderRight: "none",
                    borderRadius: "8px 0 0 8px",
                    outline: "none",
                    color: "#495057",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
                background: "#1a1a2e",
                border: "none",
                borderRadius: "0 8px 8px 0",
                cursor: "pointer",
              }}>
                Search
              </button>
            </div>

            {/* Value props */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", textAlign: "left" }}>
              {VALUE_PROPS.map((vp) => (
                <div
                  key={vp.title}
                  style={{
                    background: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "28px", color: "#1a1a2e", marginBottom: "12px", display: "block" }}
                  >
                    {vp.icon}
                  </span>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>
                    {vp.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#6c757d", lineHeight: 1.6, margin: 0 }}>
                    {vp.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARTNER NETWORK ────────────────────────────────────────────────── */}
        <section style={{ background: "#f8f9fa", padding: "72px 32px", borderTop: "1px solid #e9ecef" }}>
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

        {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
        <section style={{ background: "#1a1a2e", padding: "80px 32px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.25, marginBottom: "16px" }}>
              Secure Your Access to the Future of Research
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "36px" }}>
              Join over 400 global institutions currently leveraging our platform for data-driven academic advancement.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register?type=institution"
                style={{
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a2e",
                  background: "#ffffff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  border: "2px solid #ffffff",
                }}
              >
                Request Institutional Access
              </Link>
              <Link
                href="/register"
                style={{
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ffffff",
                  background: "transparent",
                  borderRadius: "8px",
                  textDecoration: "none",
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                Individual Signup
              </Link>
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
                © 2024 Digital Knowledge Platform. All rights reserved.
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
