"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, pagePad, cardStyle, btnPrimary, RADIUS } from "@/components/design/dkpTheme";

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

export default function PrivacyPage() {
  return (
    <CollectionShell>
      <style dangerouslySetInnerHTML={{ __html: `
        .dkp-legal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 600px) { .dkp-legal-grid { grid-template-columns: 1fr; } }
      `}} />

      <section style={{ background: C.band, borderBottom: `1px solid ${C.lineStrong}`, padding: "clamp(40px, 6vw, 64px) clamp(16px, 4vw, 64px)", textAlign: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>
          Legal
        </p>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 15, color: C.body, margin: 0 }}>
          Last updated <strong style={{ color: C.ink }}>May 28, 2026</strong> · Digital Knowledge Platform
        </p>
      </section>

      <div style={{ ...pagePad, maxWidth: 900 }}>
        <div className="dkp-legal-grid">
          {SECTIONS.map((s) => (
            <div key={s.num} style={{ ...cardStyle, padding: "22px 20px" }}>
              <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: RADIUS.full,
                background: C.ink,
                color: C.white,
                fontSize: 11,
                fontWeight: 800,
                fontFamily: SANS,
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}>
                {s.num}
              </span>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
                {s.title}
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, lineHeight: 1.65, margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          ...cardStyle,
          marginTop: 16,
          padding: "22px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>
              Questions about your privacy?
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: 0 }}>
              The Semicolon-Squad-DU team is happy to help.
            </p>
          </div>
          <Link href="/contact" style={{ ...btnPrimary, textDecoration: "none", flexShrink: 0 }}>
            Contact Us <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </CollectionShell>
  );
}
