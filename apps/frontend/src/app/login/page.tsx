"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, LogIn, Lock, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#eef0f3" }}>

      {/* ── Navbar ── */}
      <header
        className="flex items-center justify-between bg-white"
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <span
          className="font-bold"
          style={{ fontSize: "13px", color: "#111827", letterSpacing: "0.01em" }}
        >
          Digital Knowledge Platform
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:underline"
          style={{ fontSize: "13px", color: "#000000", fontWeight: 700 }}
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to Portal
        </Link>
      </header>

      {/* ── Main ── */}
      <main
        className="flex-1 flex flex-col items-center justify-center"
        style={{ padding: "48px 16px" }}
      >
        <div className="w-full" style={{ maxWidth: "420px" }}>

          {/* ── Card ── */}
          <div
            className="bg-white"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
              padding: "40px 40px 32px 40px",
            }}
          >
            {/* Heading */}
            <div className="text-center" style={{ marginBottom: "28px" }}>
              <h1
                className="font-bold"
                style={{
                  fontSize: "28px",
                  color: "#111827",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  marginBottom: "6px",
                  lineHeight: 1.2,
                }}
              >
                Sign In
              </h1>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
                Access your academic collections and research.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Email field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    color: "#000000",
                    marginBottom: "6px",
                  }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. researcher@institution.edu"
                  aria-invalid={!!errors.email}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#111827",
                    backgroundColor: "#fff",
                    border: errors.email ? "1px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#111827";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,0.07)";
                  }}
                  {...register("email", {
                    onBlur: (e) => {
                      e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    },
                  })}
                />
                {errors.email && (
                  <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }} role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: "6px" }}
                >
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.09em",
                      color: "#000000",
                    }}
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}
                    className="hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  error={errors.password?.message}
                  className="w-full"
                />
              </div>

              {/* Server error */}
              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    color: "#dc2626",
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Sign In button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{
                  padding: "13px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: "#111827",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <LogIn size={14} strokeWidth={2.5} />
                )}
                Sign In
              </button>
            </form>

            {/* OR divider */}
            <div
              className="flex items-center"
              style={{ margin: "20px 0" }}
            >
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              <span
                style={{
                  padding: "0 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9ca3af",
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            </div>

            {/* Google button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 transition-colors hover:bg-gray-50"
              style={{
                padding: "11px 16px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => toast("Google sign-in coming soon")}
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            {/* Bottom divider */}
            <div style={{ height: "1px", background: "#e5e7eb", margin: "24px 0 20px" }} />

            {/* Register link */}
            <p className="text-center" style={{ fontSize: "13px", color: "#6b7280" }}>
              New to the platform?{" "}
              <Link
                href="/register"
                className="hover:underline"
                style={{ fontWeight: 700, color: "#111827" }}
              >
                Create an Account
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div
            className="flex items-center justify-center"
            style={{ gap: "20px", marginTop: "16px" }}
          >
            <span
              className="inline-flex items-center"
              style={{ gap: "5px", fontSize: "11px", color: "#9ca3af" }}
            >
              <Lock size={11} />
              Secure Encryption
            </span>
            <span
              className="inline-flex items-center"
              style={{ gap: "5px", fontSize: "11px", color: "#9ca3af" }}
            >
              <ShieldCheck size={11} />
              GDPR Compliant
            </span>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "#e9ebee", borderTop: "1px solid #d1d5db" }}>
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "20px 32px",
            display: "grid",
            gridTemplateColumns: "160px 1fr 200px",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Brand — left */}
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", lineHeight: 1.55, margin: 0 }}>
            Digital Knowledge
            <br />
            Platform
          </p>

          {/* Links — center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <Link href="/privacy" className="hover:underline" style={{ fontSize: "13px", color: "#374151" }}>
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline" style={{ fontSize: "13px", color: "#374151" }}>
                Terms of Service
              </Link>
              <Link href="/access" className="hover:underline" style={{ fontSize: "13px", color: "#374151" }}>
                Institutional Access
              </Link>
            </div>
            <Link href="/support" className="hover:underline" style={{ fontSize: "13px", color: "#374151" }}>
              Contact Support
            </Link>
          </div>

          {/* Copyright — right */}
          <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, textAlign: "right", margin: 0 }}>
            © 2026 Digital Knowledge Platform. All rights
            <br />
            reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
