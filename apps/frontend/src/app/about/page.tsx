"use client";

import Link from "next/link";
import { Archive, BookOpen, FlaskConical, Star, Target, Lightbulb, ArrowRight } from "lucide-react";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, pagePad, cardStyle, btnPrimary, RADIUS } from "@/components/design/dkpTheme";

const COLLECTIONS = [
  { icon: Archive, label: "Digital Archive", desc: "Browse institutional documents, records, and historical collections", href: "/archive" },
  { icon: BookOpen, label: "Library Catalog", desc: "Access books, journals, research papers, and academic publications", href: "/library" },
  { icon: FlaskConical, label: "Research Hub", desc: "Discover faculty publications, datasets, and ongoing research projects", href: "/research" },
  { icon: Star, label: "Student Showcase", desc: "Celebrate exceptional student projects and academic achievements", href: "/showcase" },
];

export default function AboutPage() {
  return (
    <CollectionShell>
      <style dangerouslySetInnerHTML={{ __html: `
        .dkp-about-card { transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s ease; }
        .dkp-about-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(26,26,46,0.08); }
        .dkp-about-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; }
        .dkp-about-collections { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media (max-width: 900px) {
          .dkp-about-grid { grid-template-columns: 1fr; }
          .dkp-about-collections { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .dkp-about-collections { grid-template-columns: 1fr; }
        }
      `}} />

      {/* Hero band */}
      <section style={{ background: C.ink, color: C.white, padding: "clamp(48px, 8vw, 80px) clamp(16px, 4vw, 64px)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", margin: "0 0 16px" }}>
            University of Dhaka
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            About Digital Knowledge Platform
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.82)", margin: 0 }}>
            Empowering the University of Dhaka through unified access to institutional knowledge, faculty research, and academic excellence.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={pagePad}>
        <div className="dkp-about-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: RADIUS.md, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={24} color={C.accent} />
              </div>
              <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.ink, margin: 0 }}>Our Mission</h2>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, color: C.body, lineHeight: 1.75, margin: 0 }}>
              To develop a centralized platform that provides seamless access to library resources, research archives, and student projects while promoting knowledge sharing, academic collaboration, and efficient management of institutional data for students, researchers, and educators.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: RADIUS.md, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lightbulb size={24} color={C.accent} />
              </div>
              <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.ink, margin: 0 }}>Our Vision</h2>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 16, color: C.body, lineHeight: 1.75, margin: 0 }}>
              To create a unified digital knowledge ecosystem that transforms how academic institutions preserve, access, and share knowledge, enabling innovation, collaboration, and research excellence across all disciplines.
            </p>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section style={{ background: C.band, ...pagePad, paddingTop: 48, paddingBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(26px, 3.5vw, 32px)", fontWeight: 600, color: C.ink, margin: "0 0 10px" }}>
            Collections
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 16, color: C.body, margin: 0 }}>
            Comprehensive tools designed to support academic excellence
          </p>
        </div>

        <div className="dkp-about-collections">
          {COLLECTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="dkp-about-card"
              style={{
                ...cardStyle,
                padding: "28px 22px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                color: "inherit",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: RADIUS.md, background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <item.icon size={22} color={C.ink} />
              </div>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
                {item.label}
              </h3>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...pagePad, textAlign: "center", paddingTop: 56, paddingBottom: 64 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(26px, 3.5vw, 32px)", fontWeight: 600, color: C.ink, margin: "0 0 12px" }}>
          Ready to Explore?
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 16, color: C.body, lineHeight: 1.65, margin: "0 auto 28px", maxWidth: 520 }}>
          Join students, faculty, and researchers accessing the Digital Knowledge Platform.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ ...btnPrimary, textDecoration: "none" }}>
            Get Started <ArrowRight size={16} />
          </Link>
          <Link
            href="/archive"
            style={{
              ...btnPrimary,
              background: "transparent",
              color: C.ink,
              border: `1.5px solid ${C.ink}`,
              textDecoration: "none",
            }}
          >
            Browse Archive <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </CollectionShell>
  );
}
