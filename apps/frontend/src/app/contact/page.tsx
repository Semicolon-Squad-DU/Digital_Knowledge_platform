"use client";

import Link from "next/link";
import { GraduationCap, Mail, Github, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const TEAM_MEMBERS = [
  { name: "Faria Yasmin",    email: "fariayasmin19@gmail.com", github: "fariayasmin" },
  { name: "Yuki Bhuiyan",   email: "yukibhuiyan@gmail.com",   github: "Yukii9291"   },
  { name: "Md. Nuruzzaman", email: "nuruzzaman@gamil.com",    github: "prolexcsedu" },
  { name: "Hasibul Islam",  email: "hasibulislam@gamil.com",  github: "enol5423"    },
];

const NAV_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms",   href: "/terms"   },
  { label: "Contact", href: "/contact" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1.5px solid #e5e7eb",
  fontSize: "13.5px",
  color: "#111827",
  background: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.subject || formData.subject.trim().length < 5) {
      toast.error("Subject must be at least 5 characters");
      return;
    }
    if (!formData.message || formData.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/contact/submit", formData);
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      if (!error.response) {
        toast.error("Cannot reach the server. Make sure the backend is running on port 4000.");
      } else {
        const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg;
        toast.error(msg || `Server error (${error.response.status}). Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        .contact-split { display: grid; grid-template-columns: 1fr 1.6fr; gap: 20px; }
        .team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        input.contact-input:focus, textarea.contact-input:focus { border-color: var(--avatar-theme-color, #111827) !important; }
        @media (max-width: 768px) { .contact-split { grid-template-columns: 1fr; } .team-grid { grid-template-columns: 1fr; } }
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
            Reach Out
          </p>
          <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.75rem)", fontWeight: 800, color: "#0f1117", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px 0" }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 auto", maxWidth: "420px" }}>
            Have a question or feedback? Contact us directly or use the form below.
          </p>
        </div>

        <div style={{ maxWidth: "940px", margin: "0 auto", padding: "48px 32px 64px" }}>

          {/* Team */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", margin: "0 0 16px 0" }}>
              Semicolon-Squad-DU
            </p>
            <div className="team-grid">
              {TEAM_MEMBERS.map(m => (
                <div
                  key={m.email}
                  style={{
                    background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb",
                    padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  {/* Avatar */}
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                    background: "var(--avatar-theme-color, #111827)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: 700, color: "#ffffff",
                  }}>
                    {m.name[0]}
                  </div>
                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#111827", margin: "0 0 3px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <a href={`mailto:${m.email}`} style={{ fontSize: "11.5px", color: "var(--avatar-theme-color, #1a56db)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                      >
                        <Mail size={10} /> {m.email}
                      </a>
                      <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "11.5px", color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                      >
                        <Github size={10} /> @{m.github}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Split: info + form */}
          <div className="contact-split">

            {/* Left — contact info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* GitHub org card */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Github size={16} color="var(--avatar-theme-color, #111827)" />
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111827" }}>Organization</span>
                </div>
                <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "0 0 12px 0", lineHeight: 1.6 }}>
                  Our open-source work lives on GitHub under <strong style={{ color: "#374151" }}>Semicolon-Squad-DU</strong>.
                </p>
                <a
                  href="https://github.com/Semicolon-Squad-DU"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    fontSize: "12.5px", fontWeight: 600,
                    color: "var(--avatar-theme-color, #111827)",
                    background: "#f3f4f6", borderRadius: "6px", padding: "6px 12px",
                    textDecoration: "none", transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
                >
                  <Github size={13} /> View on GitHub
                </a>
              </div>

              {/* Response time card */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Mail size={16} color="var(--avatar-theme-color, #111827)" />
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111827" }}>Response Time</span>
                </div>
                <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "0 0 12px 0", lineHeight: 1.6 }}>
                  We aim to respond to all inquiries within <strong style={{ color: "#374151" }}>24–48 hours</strong> on business days.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                  <p style={{ fontSize: "12px", color: "#166534", margin: 0, fontWeight: 600 }}>Available Mon – Fri, 9 AM – 5 PM BDT</p>
                </div>
              </div>
            </div>

            {/* Right — contact form */}
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 4px 0" }}>Send a Message</h2>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 22px 0" }}>Fill out the form and we&apos;ll get back to you.</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  className="contact-input"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  className="contact-input"
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  className="contact-input"
                  type="text"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))}
                  style={inputStyle}
                />
                <textarea
                  className="contact-input"
                  placeholder="Your message"
                  value={formData.message}
                  onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "11px", borderRadius: "8px", border: "none",
                    background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                    fontSize: "13.5px", fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.65 : 1,
                    transition: "opacity 0.2s",
                    marginTop: "4px",
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isLoading ? "0.65" : "1"; }}
                >
                  <Send size={15} />
                  {isLoading ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{
          maxWidth: "940px", margin: "0 auto", padding: "16px 32px",
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
