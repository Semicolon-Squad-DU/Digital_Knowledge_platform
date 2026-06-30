"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    num: "01",
    title: "What We Collect",
    body: "Name, email, department, account credentials, browsing activity within the platform, device identifiers, and any content you upload.",
  },
  {
    num: "02",
    title: "How We Use It",
    body: "To manage your account, personalize your experience, improve platform features, and send essential service notifications.",
  },
  {
    num: "03",
    title: "Who We Share With",
    body: "We do not sell your data. Information is only shared when required by law or with trusted service providers who help operate the platform.",
  },
  {
    num: "04",
    title: "Data Security",
    body: "We apply industry-standard administrative, technical, and physical safeguards. No electronic system is 100% secure, but we follow best practices.",
  },
  {
    num: "05",
    title: "Your Rights",
    body: "You may access, correct, or request deletion of your personal data at any time by contacting us directly.",
  },
  {
    num: "06",
    title: "Policy Updates",
    body: "We may update this policy at any time. Material changes will be announced on the platform. Continued use constitutes acceptance.",
  },
];

const NAV_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        .legal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (max-width: 600px) { .legal-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Minimal Nav */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={13} color="#ffffff" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.01em" }}>DKP</span>
          </Link>
          <nav style={{ display: "flex", gap: "4px" }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                style={{ padding: "5px 12px", fontSize: "13px", fontWeight: 500, color: "#4b5563", textDecoration: "none", borderRadius: "6px", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#111827"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
              >{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "52px 32px 44px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--avatar-theme-color, #111827)", opacity: 0.65, margin: "0 0 12px 0" }}>
            Legal
          </p>
          <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.75rem)", fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px 0" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Last updated <strong style={{ color: "#374151" }}>May 28, 2026</strong> · Digital Knowledge Platform
          </p>
        </div>

        {/* Section cards */}
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 32px 64px" }}>
          <div className="legal-grid">
            {SECTIONS.map(s => (
              <div
                key={s.num}
                style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "22px 20px", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <span style={{
                  display: "inline-block", padding: "2px 10px", borderRadius: "100px",
                  background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                  fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "12px",
                }}>
                  {s.num}
                </span>
                <h2 style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>{s.title}</h2>
                <p style={{ fontSize: "13px", color: "#555e6d", lineHeight: 1.65, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div style={{
            marginTop: "14px", background: "#ffffff", borderRadius: "14px",
            border: "1px solid #e5e7eb", padding: "22px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          }}>
            <div>
              <h2 style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Questions about your privacy?</h2>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>The Semicolon-Squad-DU team is happy to help.</p>
            </div>
            <Link
              href="/contact"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "9px 18px", fontSize: "13px", fontWeight: 600,
                color: "#ffffff", background: "var(--avatar-theme-color, #111827)",
                borderRadius: "8px", textDecoration: "none", flexShrink: 0, transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{
          maxWidth: "860px", margin: "0 auto", padding: "16px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
        }}>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>© 2026 Digital Knowledge Platform · Semicolon-Squad-DU</p>
          <div style={{ display: "flex", gap: "16px" }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                style={{ fontSize: "12px", color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--avatar-theme-color, #111827)")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
              >{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
