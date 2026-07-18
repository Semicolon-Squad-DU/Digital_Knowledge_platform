"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { isPasswordStrong, PASSWORD_STRENGTH_MESSAGE } from "@/lib/utils";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setOtp("");
      toast.success("A new reset code has been sent to your email.");
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to resend reset code");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("A reset code has been sent to your email.");
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      toast.error(PASSWORD_STRENGTH_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResetting(true);
    try {
      await api.post("/auth/reset-password", { email, otp, new_password: newPassword });
      toast.success("Password reset! Sign in with your new password.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const inputBase: React.CSSProperties = {
    display: "block", width: "100%", padding: "10px 12px",
    // Must stay >= 16px — iOS Safari auto-zooms the viewport on focus for any
    // input under 16px, which makes typing look broken on phones.
    fontSize: "16px", color: "#111827", background: "#ffffff",
    border: "1.5px solid #e5e7eb", borderRadius: "8px",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: "linear-gradient(180deg, #eef1ff 0%, #ffffff 55%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ── */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={13} color="#ffffff" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.01em" }}>DKP</span>
          </Link>
          <Link href="/login"
            style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
          >
            Back to Sign In
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Card */}
          <div style={{
            background: "#ffffff", borderRadius: "16px",
            border: "1px solid #e5e7eb", padding: "40px 36px 32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 6px 0" }}>
                  Forgot Password?
                </h1>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  Enter your email and we&apos;ll send you a reset code.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="forgot-email" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ ...inputBase, borderColor: "#e5e7eb" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color, #111827)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "12px 16px", fontSize: "13.5px", fontWeight: 700,
                    background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                    border: "none", borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = "0.87"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isLoading ? "0.7" : "1"; }}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : <Mail size={15} strokeWidth={2.5} />}
                  Send Reset Code
                </button>
              </form>

            </>
          ) : (
            <>
              {/* Heading */}
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--avatar-theme-color, #1a1a2e)", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 6px 0" }}>
                  Check Your Email
                </h1>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  We sent a reset code to <strong>{email}</strong>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleReset} noValidate>
                {/* Reset Code */}
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="reset-code" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    6-digit code
                  </label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{ ...inputBase, borderColor: "#e5e7eb", letterSpacing: "0.15em", textAlign: "center", fontSize: "16px", fontWeight: 600 }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color, #111827)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
                  />
                </div>

                {/* New Password */}
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="reset-password" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    New password
                  </label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full"
                  />
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "5px" }}>
                    8+ characters with uppercase, lowercase, digit, and special character (@$!%*?&)
                  </p>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: "20px" }}>
                  <label htmlFor="reset-confirm" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Confirm password
                  </label>
                  <Input
                    id="reset-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isResetting}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "12px 16px", fontSize: "13.5px", fontWeight: 700,
                    background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                    border: "none", borderRadius: "8px",
                    cursor: isResetting ? "not-allowed" : "pointer",
                    opacity: isResetting ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => { if (!isResetting) e.currentTarget.style.opacity = "0.87"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isResetting ? "0.7" : "1"; }}
                >
                  {isResetting ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : <CheckCircle size={15} strokeWidth={2.5} />}
                  Reset Password
                </button>
              </form>

              {/* Resend link */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: "20px 0 0 0" }}>
                No code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  style={{ background: "none", border: "none", color: "#111827", fontWeight: 700, cursor: isResending ? "not-allowed" : "pointer", textDecoration: "none", opacity: isResending ? 0.6 : 1, transition: "opacity 0.2s" }}
                  onMouseEnter={e => { if (!isResending) e.currentTarget.style.opacity = "0.8"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isResending ? "0.6" : "1"; }}
                >
                  {isResending ? "Sending..." : "Send again"}
                </button>
              </p>
            </>
          )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>© 2026 Digital Knowledge Platform</p>
          <div style={{ display: "flex", gap: "16px" }}>
            {[{ l: "Privacy", h: "/privacy" }, { l: "Terms", h: "/terms" }, { l: "Contact", h: "/contact" }].map(x => (
              <Link key={x.l} href={x.h} style={{ fontSize: "12px", color: "#6b7280", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
              >{x.l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #eef1ff 0%, #ffffff 55%)" }}>
        <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Loading…</div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
