"use client";

import Link from "next/link";
import { Mail, Github, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { CollectionShell } from "@/components/design/CollectionShell";
import { C, SERIF, SANS, pagePad, cardStyle, btnPrimary, inputStyle, RADIUS } from "@/components/design/dkpTheme";

const TEAM_MEMBERS = [
  { name: "Faria Yasmin", email: "faria-2021611197@cs.du.ac.bd", github: "fariayasmin" },
  { name: "Yuki Bhuiyan", email: "yuki-2021816226@cs.du.ac.bd", github: "Yukii9291" },
  { name: "Md. Nuruzzaman", email: "md-2021611232@cs.du.ac.bd", github: "prolexcsedu" },
  { name: "Hasibul Islam", email: "hasibulislam-2021211218@cs.du.ac.bd", github: "enol5423" },
];

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
    <CollectionShell>
      <style dangerouslySetInnerHTML={{ __html: `
        .dkp-contact-split { display: grid; grid-template-columns: 1fr 1.6fr; gap: 20px; }
        .dkp-team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (max-width: 768px) {
          .dkp-contact-split { grid-template-columns: 1fr; }
          .dkp-team-grid { grid-template-columns: 1fr; }
        }
      `}} />

      <section style={{ background: C.band, borderBottom: `1px solid ${C.lineStrong}`, padding: "clamp(40px, 6vw, 64px) clamp(16px, 4vw, 64px)", textAlign: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>
          Reach Out
        </p>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
          Get in Touch
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 16, color: C.body, margin: "0 auto", maxWidth: 440, lineHeight: 1.6 }}>
          Have a question or feedback? Contact us directly or use the form below.
        </p>
      </section>

      <div style={{ ...pagePad, maxWidth: 960 }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.body, margin: "0 0 16px" }}>
            Semicolon-Squad-DU
          </p>
          <div className="dkp-team-grid">
            {TEAM_MEMBERS.map((m) => (
              <div
                key={m.email}
                style={{
                  ...cardStyle,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: C.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: SERIF,
                }}>
                  {m.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.ink, margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <a
                      href={`mailto:${m.email}`}
                      style={{ fontSize: 12, color: C.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontFamily: SANS }}
                    >
                      <Mail size={11} /> {m.email}
                    </a>
                    <a
                      href={`https://github.com/${m.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: C.body, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontFamily: SANS }}
                    >
                      <Github size={11} /> @{m.github}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dkp-contact-split">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...cardStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Github size={16} color={C.ink} />
                <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.ink }}>Organization</span>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: "0 0 14px", lineHeight: 1.6 }}>
                Our open-source work lives on GitHub under <strong style={{ color: C.ink }}>Semicolon-Squad-DU</strong>.
              </p>
              <a
                href="https://github.com/Semicolon-Squad-DU"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: SANS,
                  color: C.ink,
                  background: C.chip,
                  borderRadius: RADIUS.DEFAULT,
                  padding: "8px 12px",
                  textDecoration: "none",
                }}
              >
                <Github size={13} /> View on GitHub
              </a>
            </div>

            <div style={{ ...cardStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Mail size={16} color={C.ink} />
                <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.ink }}>Response Time</span>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: "0 0 14px", lineHeight: 1.6 }}>
                We aim to respond to all inquiries within <strong style={{ color: C.ink }}>24–48 hours</strong> on business days.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f0fdf4", borderRadius: RADIUS.DEFAULT, border: "1px solid #bbf7d0" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                <p style={{ fontFamily: SANS, fontSize: 12, color: "#166534", margin: 0, fontWeight: 600 }}>
                  Available Mon – Fri, 9 AM – 5 PM BDT
                </p>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 28 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>
              Send a Message
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: "0 0 22px" }}>
              Fill out the form and we&apos;ll get back to you.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle()}
              />
              <input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                style={inputStyle()}
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
                style={inputStyle()}
              />
              <textarea
                placeholder="Your message"
                value={formData.message}
                onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                style={{ ...inputStyle(), resize: "vertical" }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...btnPrimary,
                  marginTop: 4,
                  opacity: isLoading ? 0.65 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                <Send size={15} />
                {isLoading ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </CollectionShell>
  );
}
