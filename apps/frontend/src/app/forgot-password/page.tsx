"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Library, Mail } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { isPasswordStrong, PASSWORD_STRENGTH_MESSAGE } from "@/lib/utils";
import { C, SERIF, SANS, inputStyle, btnPrimary, RADIUS } from "@/components/design/dkpTheme";

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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: C.ink,
    marginBottom: 8,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: SANS, background: C.white }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-auth-panel { display: none !important; }
          .dkp-auth-form { padding: 32px 20px !important; }
        }
      `}} />

      <aside
        className="dkp-auth-panel"
        style={{
          flex: "1 1 50%",
          position: "relative",
          minHeight: "100vh",
          background: C.ink,
          color: C.white,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px clamp(28px, 4vw, 56px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/auth-login-panel.png"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(26,26,46,0.72) 0%, rgba(26,26,46,0.88) 100%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 440, paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Library size={22} />
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700 }}>DU DKP</span>
          </div>
          <h1 style={{
            fontFamily: SERIF,
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 700,
            margin: "0 0 16px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            Recover your<br />account access
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", margin: 0 }}>
            Enter your institutional email to receive a reset code, then set a new password for the Digital Knowledge Platform.
          </p>
        </div>
      </aside>

      <main
        className="dkp-auth-form"
        style={{
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px clamp(20px, 5vw, 64px)",
          background: C.white,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          {!isSubmitted ? (
            <>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
                Forgot Password?
              </h2>
              <p style={{ fontSize: 15, color: C.body, margin: "0 0 28px", lineHeight: 1.55 }}>
                Enter your email and we&apos;ll send you a reset code.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 22 }}>
                  <label htmlFor="forgot-email" style={labelStyle}>Institutional Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@du.ac.bd"
                    style={inputStyle()}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    ...btnPrimary,
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? (
                    "Sending…"
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Mail size={16} /> Send Reset Code
                    </span>
                  )}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 14, color: C.body, margin: "24px 0 0" }}>
                Remember your password?{" "}
                <Link href="/login" style={{ fontWeight: 700, color: C.accent, textDecoration: "none" }}>
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
                Check Your Email
              </h2>
              <p style={{ fontSize: 15, color: C.body, margin: "0 0 28px", lineHeight: 1.55 }}>
                We sent a reset code to <strong style={{ color: C.ink }}>{email}</strong>
              </p>

              <form onSubmit={handleReset} noValidate>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="reset-code" style={labelStyle}>6-digit code</label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{
                      ...inputStyle(),
                      letterSpacing: "0.15em",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="reset-password" style={labelStyle}>New password</label>
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle()}
                  />
                  <p style={{ fontSize: 12, color: C.body, marginTop: 6, lineHeight: 1.45 }}>
                    8+ characters with uppercase, lowercase, digit, and special character (@$!%*?&)
                  </p>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label htmlFor="reset-confirm" style={labelStyle}>Confirm password</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle()}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  style={{
                    ...btnPrimary,
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: 15,
                    opacity: isResetting ? 0.7 : 1,
                    cursor: isResetting ? "not-allowed" : "pointer",
                  }}
                >
                  {isResetting ? (
                    "Resetting…"
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle size={16} /> Reset Password
                    </span>
                  )}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 14, color: C.body, margin: "20px 0 0" }}>
                No code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.accent,
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: SANS,
                    cursor: isResending ? "not-allowed" : "pointer",
                    opacity: isResending ? 0.6 : 1,
                    padding: 0,
                  }}
                >
                  {isResending ? "Sending…" : "Send again"}
                </button>
              </p>

              <div style={{ height: 1, background: C.lineStrong, margin: "24px 0 18px" }} />
              <p style={{ textAlign: "center", fontSize: 14, color: C.body, margin: 0 }}>
                <Link href="/login" style={{ fontWeight: 700, color: C.accent, textDecoration: "none" }}>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: SANS, color: C.body }}>
          Loading…
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
