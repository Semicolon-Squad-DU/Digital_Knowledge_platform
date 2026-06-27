"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      toast.success("Reset link sent to your email!");
    } catch (error) {
      toast.error("Failed to send reset link");
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "100px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
              <div style={{ height: "12px", width: "40px", background: "#f3f4f6", marginBottom: "12px" }} />
              <div style={{ height: "24px", width: "80px", background: "#e5e7eb" }} />
            </div>
          ))}
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
        zIndex: 2
      }}>
        <Link
          href="/login"
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
          Back to Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        position: "relative",
        zIndex: 2
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          padding: "40px 32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
        }}>
          {!isSubmitted ? (
            <>
              {/* Icon */}
              <div style={{
                width: "56px",
                height: "56px",
                background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px"
              }}>
                <Mail size={28} color="#ffffff" />
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#111827",
                margin: "0 0 8px 0",
                lineHeight: 1.2
              }}>
                Forgot Password?
              </h1>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0 0 24px 0",
                lineHeight: 1.5
              }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "8px"
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      background: "#ffffff",
                      color: "#111827",
                      boxSizing: "border-box",
                      transition: "all 0.2s"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--avatar-theme-color)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(var(--avatar-theme-color), 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.currentTarget.style.opacity = "1";
                  }}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              {/* Back to Sign In */}
              <p style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                margin: "24px 0 0 0"
              }}>
                Remember your password?{" "}
                <Link
                  href="/login"
                  style={{
                    color: "var(--avatar-theme-color)",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div style={{
                width: "56px",
                height: "56px",
                background: "linear-gradient(135deg, #16a34a 0%, rgba(255,255,255,0.45) 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px"
              }}>
                <CheckCircle size={28} color="#ffffff" />
              </div>

              <h1 style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#111827",
                margin: "0 0 8px 0",
                lineHeight: 1.2
              }}>
                Check Your Email
              </h1>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0 0 24px 0",
                lineHeight: 1.5
              }}>
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>

              <div style={{
                padding: "16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                marginBottom: "24px"
              }}>
                <p style={{
                  fontSize: "13px",
                  color: "#166534",
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, var(--avatar-theme-color) 0%, rgba(255,255,255,0.45) 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Try Another Email
              </button>

              <p style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                margin: "24px 0 0 0"
              }}>
                <Link
                  href="/login"
                  style={{
                    color: "var(--avatar-theme-color)",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
