"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Archive, BookOpen, FlaskConical, Star, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const QUICK_LINKS = [
  { label: "Browse Archive", href: "/archive", icon: Archive, bg: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)", color: "#ffffff", desc: "Search institutional documents" },
  { label: "Library Catalog", href: "/library", icon: BookOpen, bg: "linear-gradient(135deg, #3a3a3a 0%, #1f1f1f 100%)", color: "#ffffff", desc: "Books, journals & more" },
  { label: "Research Repository", href: "/research", icon: FlaskConical, bg: "linear-gradient(135deg, #2f2f2f 0%, #1a1a1a 100%)", color: "#ffffff", desc: "Faculty publications & datasets" },
  { label: "Showcase Gallery", href: "/showcase", icon: Star, bg: "linear-gradient(135deg, #353535 0%, #1e1e1e 100%)", color: "#ffffff", desc: "Student project highlights" },
];

export default function AdminHubPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [line1Text, setLine1Text] = useState("");
  const [line2Text, setLine2Text] = useState("");
  const [authPhase, setAuthPhase] = useState<"line1" | "line2" | "done">("line1");

  const AUTH_LINE_1 = "Yuki-2,";
  const AUTH_LINE_2 = "your research workspace is ready.";

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role === "librarian") {
      router.push("/librarian");
      return;
    }

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
  }, [authPhase, isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role === "librarian") return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; direction:ltr; -webkit-font-smoothing:antialiased; }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}} />

      <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
        {/* ── TOP NAV ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px" }}>
            <Navbar />
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ background: "#ffffff", padding: "40px 32px 72px", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto", textAlign: "center", display: "block", flexDirection: "column" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
              WELCOME BACK
            </p>
            <h1 style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 800, color: "#111827", lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "3.5em" }}>
              <div style={{ whiteSpace: "nowrap", minHeight: "1.2em", display: "flex", alignItems: "center" }}>
                {line1Text}
                {authPhase === "line1" && (
                  <span style={{
                    display: "inline-block",
                    width: "2px",
                    height: "1em",
                    background: "#111827",
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    animation: "cursorBlink 0.7s steps(1) infinite",
                  }} />
                )}
              </div>
              <div style={{ whiteSpace: "nowrap", minHeight: "1.2em", display: "flex", alignItems: "center" }}>
                {line2Text}
                {authPhase === "line2" && (
                  <span style={{
                    display: "inline-block",
                    width: "2px",
                    height: "1em",
                    background: "#111827",
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    animation: "cursorBlink 0.7s steps(1) infinite",
                  }} />
                )}
              </div>
            </h1>
            <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 48px" }}>
              {user?.department ? `${user.department} · ` : ""}
              <span style={{ textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</span>
              {" "}— pick up where you left off.
            </p>
            {/* Quick access grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, maxWidth: 700, margin: "0 auto 40px", textAlign: "center" }}>
              {QUICK_LINKS.map(ql => (
                <Link key={ql.href} href={ql.href} style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16, 
                  padding: "32px 28px", 
                  borderRadius: 12, 
                  background: ql.bg, 
                  textDecoration: "none", 
                  border: `2px solid #444444`,
                  transition: "all 0.3s",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 48px rgba(0,0,0,0.5)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#444444";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <ql.icon size={24} style={{ color: "#000" }} />
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
          </div>
        </section>

      </div>
    </>
  );
}
