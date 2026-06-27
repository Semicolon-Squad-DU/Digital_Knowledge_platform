"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, LogIn, Lock, ShieldCheck, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

// ── Role options ──────────────────────────────────────────────────────────────
const ROLES = [
  { value: "member", label: "Member", desc: "Browse and access published content" },
  { value: "student_author", label: "Student Author", desc: "Submit projects to the showcase" },
  { value: "researcher", label: "Researcher", desc: "Publish research outputs and manage labs" },
  { value: "archivist", label: "Archivist", desc: "Upload and manage archive documents" },
  { value: "librarian", label: "Librarian", desc: "Manage library catalog and lending" },
  { value: "admin", label: "Admin", desc: "Full platform access and user management" },
] as const;
type RoleValue = typeof ROLES[number]["value"];

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin";
  const { login, setUser } = useAuthStore();
  const [error, setError] = useState("");
  const [googleProfile, setGoogleProfile] = useState<{
    email: string;
    name: string;
    sub: string;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleValue>("member");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

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

  const handleOAuthAuthorize = async (oauthData: {
    email: string;
    name: string;
    role: string;
    provider: "google" | "sso";
    providerId: string;
    department?: string;
  }) => {
    try {
      const res = await api.post("/auth/oauth-login", oauthData);
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(redirectTo);
    } catch (err: any) {
      // Error is already handled in handleRoleConfirm
      throw err;
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }

    if (typeof window !== "undefined" && (window as any).google) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              const loadingToast = toast.loading("Fetching Google profile...");
              try {
                const profileRes = await fetch(
                  `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
                );
                const profile = await profileRes.json();
                toast.dismiss(loadingToast);
                
                // Store profile and show role selection modal
                setGoogleProfile(profile);
                setSelectedRole("member"); // Reset to default
                setShowRoleModal(true);
              } catch (e) {
                toast.dismiss(loadingToast);
                toast.error("Failed to fetch user profile from Google");
              }
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        toast.error("Failed to initialize Google Sign-In SDK");
      }
    } else {
      toast.error("Google SDK is still loading. Please try again in a moment.");
    }
  };

  const handleRoleConfirm = async () => {
    if (!googleProfile) return;

    setRoleError("");
    setIsSubmittingRole(true);
    
    try {
      await handleOAuthAuthorize({
        email: googleProfile.email,
        name: googleProfile.name,
        role: selectedRole,
        provider: "google",
        providerId: `google_${googleProfile.sub}`,
        department: "",
      });

      setShowRoleModal(false);
      setGoogleProfile(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to complete sign-in";
      setRoleError(errorMsg);
      setIsSubmittingRole(false);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#f3f4f6" }}>
      {/* Mock Blurred Dashboard Layout in the Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0
      }} className="login-mock-layout">
        {/* Mock Sidebar */}
        <div style={{ background: "#111827", borderRight: "1px solid #1f2937", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ height: "32px", width: "120px", background: "#374151", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: "24px", width: i % 2 === 0 ? "80%" : "60%", background: "#1f2937", borderRadius: "4px" }} />
            ))}
          </div>
        </div>

        {/* Mock Content */}
        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px", background: "#f9fafb" }}>
          {/* Mock Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ height: "28px", width: "200px", background: "#e5e7eb", borderRadius: "6px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ height: "36px", width: "80px", background: "#e5e7eb", borderRadius: "6px" }} />
              <div style={{ height: "36px", width: "36px", borderRadius: "50%", background: "#e5e7eb" }} />
            </div>
          </div>

          {/* Mock Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "100px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" }}>
                <div style={{ height: "12px", width: "40px", background: "#f3f4f6", marginBottom: "12px" }} />
                <div style={{ height: "24px", width: "80px", background: "#e5e7eb" }} />
              </div>
            ))}
          </div>

          {/* Mock Table/List */}
          <div style={{ flex: 1, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ height: "16px", width: "150px", background: "#e5e7eb", marginBottom: "8px" }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
                <div style={{ height: "16px", width: "16px", background: "#f3f4f6", borderRadius: "4px" }} />
                <div style={{ height: "12px", width: i % 2 === 0 ? "200px" : "150px", background: "#f3f4f6" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop blur overlay - Dark overlay to match Change Password page's backdrop overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "rgba(0, 0, 0, 0.4)", // matches change password overlay exactly
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* ── Navbar ── */}
      <header
        className="flex items-center justify-between login-navbar"
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          position: "relative",
          zIndex: 2
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:underline"
          style={{ fontSize: "13px", color: "var(--avatar-theme-color, #000000)", fontWeight: 700, transition: "color 0.2s", textDecoration: "none" }}
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <span
          className="font-bold login-navbar-title"
          style={{ fontSize: "13px", color: "var(--avatar-theme-color, #111827)", letterSpacing: "0.01em", transition: "color 0.2s" }}
        >
          Digital Knowledge Platform
        </span>
      </header>

      {/* ── Main ── */}
      <main
        className="flex-1 flex flex-col items-center justify-center login-container"
        style={{ padding: "48px 16px", position: "relative", zIndex: 2 }}
      >
        <div className="w-full" style={{ maxWidth: "420px" }}>

          {/* ── Card ── */}
          <div
            className="bg-white/90 login-card"
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(229, 231, 235, 0.9)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              padding: "40px 40px 32px 40px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Heading */}
            <div className="text-center" style={{ marginBottom: "28px" }}>
              <h1
                className="font-bold login-heading"
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
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }} className="login-heading-desc">
                Access your academic collections and research.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Email field */}
              <div style={{ marginBottom: "20px" }} className="login-form-group">
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
                  className="login-label"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder=""
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
                  className="login-input"
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
              <div style={{ marginBottom: "20px" }} className="login-form-group">
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
                    className="login-label"
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
                  className="w-full login-input"
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
                className="w-full flex items-center justify-center gap-2 disabled:opacity-60 login-button"
                style={{
                  padding: "13px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.filter = "brightness(1.15)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.filter = "none";
                    e.currentTarget.style.transform = "none";
                  }
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
              className="flex items-center login-divider"
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
              className="w-full flex items-center justify-center gap-2.5 transition-colors hover:bg-gray-50 login-button"
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
              onClick={handleGoogleSignIn}
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
            className="flex items-center justify-center login-trust-badges"
            style={{ gap: "20px", marginTop: "16px" }}
          >
            <span
              className="inline-flex items-center"
              style={{ gap: "5px", fontSize: "11px", color: "#e5e7eb" }}
            >
              <Lock size={11} />
              Secure Encryption
            </span>
            <span
              className="inline-flex items-center"
              style={{ gap: "5px", fontSize: "11px", color: "#e5e7eb" }}
            >
              <ShieldCheck size={11} />
              GDPR Compliant
            </span>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "rgba(233, 235, 238, 0.75)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", borderTop: "1px solid rgba(209, 213, 219, 0.8)", position: "relative", zIndex: 2 }} className="login-footer">
        <div
          className="login-footer-content"
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }} className="login-footer-links">
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="login-footer-links-row">
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
          <p className="login-footer-copyright" style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, textAlign: "right", margin: 0 }}>
            © 2026 Digital Knowledge Platform. All rights
            <br />
            reserved.
          </p>
        </div>
      </footer>

      {/* Role Selection Modal for Google Sign-In */}
      {showRoleModal && googleProfile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "32px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
                  Select Your Role
                </h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  Choose how you&apos;ll use the platform
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setGoogleProfile(null);
                  setRoleError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#6b7280",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Google Profile Info */}
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px",
            }}>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>Signing in as</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0 }}>
                {googleProfile.name} ({googleProfile.email})
              </p>
            </div>

            {/* Role Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  style={{
                    padding: "12px 16px",
                    border: `2px solid ${selectedRole === role.value ? "#1a1a2e" : "#e5e7eb"}`,
                    background: selectedRole === role.value ? "#f0f0f5" : "#ffffff",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#1a1a2e";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = selectedRole === role.value ? "#1a1a2e" : "#e5e7eb";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>
                        {role.label}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                        {role.desc}
                      </p>
                    </div>
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${selectedRole === role.value ? "#1a1a2e" : "#d1d5db"}`,
                      background: selectedRole === role.value ? "#1a1a2e" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {selectedRole === role.value && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {roleError && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "20px",
              }}>
                <p style={{ fontSize: "12px", color: "#dc2626", margin: 0, lineHeight: 1.5 }}>
                  {roleError}
                </p>
                <p style={{ fontSize: "11px", color: "#991b1b", margin: "8px 0 0 0" }}>
                  ℹ️ Your role is permanently tied to your account and cannot be changed. Please use your registered role or contact an administrator if you need to change it.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setGoogleProfile(null);
                  setRoleError("");
                }}
                disabled={isSubmittingRole}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSubmittingRole ? "not-allowed" : "pointer",
                  opacity: isSubmittingRole ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleConfirm}
                disabled={isSubmittingRole}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "linear-gradient(135deg, #1a1a2e 0%, #111116 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSubmittingRole ? "not-allowed" : "pointer",
                  opacity: isSubmittingRole ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSubmittingRole ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#eef0f3" }}>
        <div style={{ fontSize: "14px", color: "#4b5563", fontWeight: 500 }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
