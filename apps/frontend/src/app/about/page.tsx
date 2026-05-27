"use client";

import Link from "next/link";
import { Archive, BookOpen, FlaskConical, Star, Users, Target, Lightbulb, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
      `}} />

      <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
        
        {/* ── NAVBAR ── */}
        <header style={{ background: "#ffffff", borderBottom: "1px solid #e9ecef", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
            <Link href="/" style={{ fontSize: "15px", fontWeight: 700, color: "var(--avatar-theme-color, #1a1a2e)", letterSpacing: "-0.01em", textDecoration: "none", transition: "color 0.2s ease" }}>
              Digital Knowledge Platform
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {[
                { label: "Archive", href: "/archive", protected: true },
                { label: "Library", href: "/library", protected: true },
                { label: "Research", href: "/research", protected: true },
                { label: "About", href: "/about", protected: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ 
                    padding: "6px 14px", 
                    fontSize: "13px", 
                    fontWeight: 500, 
                    color: item.label === "About" ? "var(--avatar-theme-color, #1a1a2e)" : "#495057",
                    textDecoration: "none", 
                    borderRadius: "6px",
                    background: item.label === "About" ? "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, transparent)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 12%, transparent)")}
                  onMouseLeave={e => (e.currentTarget.style.background = item.label === "About" ? "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, transparent)" : "transparent")}
                >{item.label}</Link>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--avatar-theme-color, #1a1a2e)";
                  e.currentTarget.style.color = "var(--avatar-theme-color, #1a1a2e)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#dee2e6";
                  e.currentTarget.style.color = "#495057";
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
                  background: "var(--avatar-theme-color, #1a1a2e)", 
                  borderRadius: "6px", 
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO SECTION ── */}
        <section style={{ background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", padding: "80px 32px", color: "#ffffff", transition: "background 0.3s ease" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.02em" }}>
              About Digital Knowledge Platform
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: "700px", margin: "0 auto" }}>
              Empowering the University of Dhaka through unified access to institutional knowledge, faculty research, and academic excellence.
            </p>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section style={{ padding: "80px 32px", background: "#ffffff" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
              {/* Mission */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, #f8f9fa)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
                    <Target size={28} style={{ color: "var(--avatar-theme-color, #1a1a2e)", transition: "color 0.3s ease" }} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, transition: "color 0.3s ease" }}>Our Mission</h2>
                </div>
                <p style={{ fontSize: "15px", color: "#17111c", lineHeight: 1.8, margin: 0 }}>
                 To develop a centralized platform that provides seamless access to library resources, research archives, and student projects while promoting knowledge sharing, academic collaboration, and efficient management of institutional data for students, researchers, and educators.
                </p>
              </div>

              {/* Vision */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 8%, #f8f9fa)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
                    <Lightbulb size={28} style={{ color: "var(--avatar-theme-color, #1a1a2e)", transition: "color 0.3s ease" }} />
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--avatar-theme-color, #1a1a2e)", margin: 0, transition: "color 0.3s ease" }}>Our Vision</h2>
                </div>
                <p style={{ fontSize: "15px", color: "#6c757d", lineHeight: 1.8, margin: 0 }}>
                 To create a unified digital knowledge ecosystem that transforms how academic institutions preserve, access, and share knowledge, enabling innovation, collaboration, and research excellence across all disciplines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CORE FEATURES ── */}
        <section style={{ padding: "80px 32px", background: "#f8f9facc" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--avatar-theme-color, #1a1a2e)", marginBottom: "12px", transition: "color 0.3s ease" }}>
                Core Features
              </h2>
              <p style={{ fontSize: "16px", color: "#6c757d" }}>
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
            <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "20px" }}>
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
        <footer style={{ background: "#f1f3f5", borderTop: "1px solid #dee2e6", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>
              © 2026 Digital Knowledge Platform | University of Dhaka. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
