"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Github, ExternalLink, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const TEAM_MEMBERS = [
  { name: "Faria Yasmin", email: "fariayasmin19@gmail.com", github: "fariayasmin" },
  { name: "Yuki Bhuiyan", email: "yukibhuiyan@gmail.com", github: "Yukii9291" },
  { name: "Md. Nuruzzaman", email: "nuruzzaman@gamil.com", github: "prolexcsedu" },
  { name: "Hasibul Islam", email: "hasibulislam@gamil.com", github: "enol5423" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post("/contact/submit", formData);
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background: "var(--theme-gradient-160)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Mock Content */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        background: "#f9fafb",
        zIndex: 0
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: "28px", width: "200px", background: "#e5e7eb", borderRadius: "6px" }} />
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ height: "36px", width: "80px", background: "#e5e7eb", borderRadius: "6px" }} />
            <div style={{ height: "36px", width: "36px", borderRadius: "50%", background: "#e5e7eb" }} />
          </div>
        </div>
      </div>

      {/* Backdrop blur overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "rgba(0, 0, 0, 0.4)",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* Navbar */}
      <header style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
        position: "relative",
        zIndex: 2,
        overflowX: "hidden"
      }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--avatar-theme-color, #000000)",
            fontWeight: 700,
            textDecoration: "none",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "32px 24px",
        position: "relative",
        zIndex: 2,
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", overflowX: "hidden" }}>
          {/* Hero Section */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h1 style={{
              fontSize: "clamp(28px, 6vw, 48px)",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "12px",
              lineHeight: 1.2
            }}>
              Get in Touch
            </h1>
            <p style={{
              fontSize: "clamp(14px, 4vw, 16px)",
              color: "#6b7280",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              Have a question? Contact our team.
            </p>
          </div>

          {/* Team Members Grid */}
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              Meet the Team - Semicolon-Squad-DU
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "32px"
            }}>
              {TEAM_MEMBERS.map((member) => (
                <div key={member.email} style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "24px",
                  textAlign: "center",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "var(--avatar-theme-color, linear-gradient(135deg, #667eea 0%, #764ba2 100%))",
                    margin: "0 auto 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "24px",
                    fontWeight: 700
                  }}>
                    {member.name[0]}
                  </div>
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "12px",
                    margin: "0 0 12px 0"
                  }}>
                    {member.name}
                  </h3>
                  <p style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "0",
                    padding: "0"
                  }}>
                    {member.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "48px"
          }}>
            {/* Quick Email */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "24px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Mail size={24} color="var(--avatar-theme-color, #1a56db)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>Email Team Members</h3>
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", margin: "0 0 16px 0" }}>
                Reach out directly to any team member:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {TEAM_MEMBERS.map((member) => (
                  <a
                    key={member.email}
                    href={`mailto:${member.email}`}
                    style={{
                      fontSize: "12px",
                      color: "var(--avatar-theme-color, #1a56db)",
                      textDecoration: "none",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(26, 86, 219, 0.1)",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#0f3a7d"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--avatar-theme-color, #1a56db)"}
                  >
                    {member.email}
                  </a>
                ))}
              </div>
            </div>

            {/* GitHub Org */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "24px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Github size={24} color="var(--avatar-theme-color, #1a56db)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>Development</h3>
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", margin: "0 0 16px 0" }}>
                <strong>Organization:</strong> Semicolon-Squad-DU
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px", margin: "0 0 16px 0" }}>
                A dedicated team of developers, designers, and strategists.
              </p>
              <a
                href="https://github.com/Semicolon-Squad-DU"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "var(--avatar-theme-color, #1a56db)",
                  textDecoration: "none",
                  padding: "8px 12px",
                  background: "rgba(26, 86, 219, 0.1)",
                  borderRadius: "6px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(26, 86, 219, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(26, 86, 219, 0.1)";
                }}
              >
                <Github size={14} />
                Visit Organization
              </a>
            </div>

            {/* Response Time */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "24px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <ExternalLink size={24} color="var(--avatar-theme-color, #1a56db)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>Support</h3>
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", margin: "0 0 16px 0" }}>
                We aim to respond to all inquiries within 24-48 hours during business days.
              </p>
              <div style={{
                padding: "12px",
                background: "rgba(34, 197, 94, 0.1)",
                borderRadius: "6px",
                borderLeft: "3px solid #22c55e"
              }}>
                <p style={{ fontSize: "12px", color: "#166534", margin: 0, fontWeight: 600 }}>
                  ✓ Available Mon-Fri, 9 AM - 5 PM UTC
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            padding: "clamp(20px, 5vw, 32px)",
            maxWidth: "600px",
            margin: "0 auto",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
          }}>
            <h2 style={{
              fontSize: "clamp(20px, 5vw, 24px)",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "8px",
              margin: "0 0 8px 0"
            }}>
              Send Us a Message
            </h2>
            <p style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "24px",
              margin: "0 0 24px 0"
            }}>
              Fill out the form below and we&apos;ll get back to you.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                style={{
                  padding: "12px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", fontSize: "14px",
                }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                style={{
                  padding: "12px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", fontSize: "14px",
                }}
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
                style={{
                  padding: "12px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", fontSize: "14px",
                }}
              />
              <textarea
                placeholder="Your message"
                value={formData.message}
                onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                style={{
                  padding: "12px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", fontSize: "14px",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "12px", borderRadius: "8px", border: "none",
                  background: "var(--avatar-theme-color, #1a56db)", color: "#fff",
                  fontSize: "14px", fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <Send size={16} />
                {isLoading ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
