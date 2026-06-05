"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, ShieldCheck, BookCopy, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { MockOAuthModal } from "@/components/ui/MockOAuthModal";

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

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  department: z.string().optional(),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Uppercase letter required")
    .regex(/[a-z]/, "Lowercase letter required")
    .regex(/\d/, "Digit required")
    .regex(/[@$!%*?&]/, "Special character required"),
});
type FormData = z.infer<typeof schema>;

// ── Password strength checker ─────────────────────────────────────────────────
function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One digit (0-9)", ok: /\d/.test(password) },
    { label: "Special (@$!%*?&)", ok: /[@$!%*?&]/.test(password) },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: "10px" }}>
      {checks.map((c) => (
        <label key={c.label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", color: "#6b7280", cursor: "default" }}>
          <span style={{
            width: "14px", height: "14px", borderRadius: "50%",
            border: `1.5px solid ${c.ok ? "#1a1a2e" : "#d1d5db"}`,
            background: c.ok ? "#1a1a2e" : "transparent",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {c.ok && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {c.label}
        </label>
      ))}
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  padding: "10px 12px",
  fontSize: "13px",
  color: "#111827",
  background: "#ffffff",
  border: `1px solid ${hasError ? "#ef4444" : "#d1d5db"}`,
  borderRadius: "6px",
  outline: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  // Suppress browser default blue focus ring on select elements
  WebkitAppearance: "none",
  MozAppearance: "none",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  color: "#111827",
  marginBottom: "6px",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleValue>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "sso">("google");

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: FormData) => {
    if (!agreed) { setError("You must agree to the Terms of Service to continue."); return; }
    setError("");
    try {
      const res = await api.post("/auth/register", { ...data, role: selectedRole });
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success("Account created successfully!");
      router.push("/admin");
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })?.response?.data;
      if (response?.errors?.length) {
        setError(response.errors.map((e: { msg: string }) => e.msg).join(" · "));
      } else {
        setError(response?.message || "Registration failed. Please try again.");
      }
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
    setOauthModalOpen(false);
    setGoogleConfigModalOpen(false);
    try {
      const res = await api.post("/auth/oauth-login", oauthData);
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success(`Account authorized successfully: Welcome, ${user.name}!`);
      router.push("/admin");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sign up via OAuth");
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
                
                await handleOAuthAuthorize({
                  email: profile.email,
                  name: profile.name,
                  role: selectedRole, // Registers as selected role
                  provider: "google",
                  providerId: `google_${profile.sub}`,
                  department: "",
                });
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f4f6", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: "relative", overflow: "hidden" }}>
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
      }}>
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
      <header style={{ background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", borderBottom: "1px solid rgba(229, 231, 235, 0.8)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: "58px", justifyContent: "space-between" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:underline"
            style={{ fontSize: "14px", color: "var(--avatar-theme-color, #111827)", fontWeight: 700, transition: "color 0.2s", textDecoration: "none", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.01em", transition: "color 0.2s" }}>
            Digital Knowledge Platform
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "32px 16px", position: "relative", zIndex: 2, overflowX: "hidden" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "40px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ minWidth: "280px" }}>
            <h1 style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: "16px", letterSpacing: "-0.02em", transition: "color 0.2s" }}>
              Join the Platform.
            </h1>
            <p style={{ fontSize: "14px", color: "#e5e7eb", lineHeight: 1.7, marginBottom: "28px" }}>

            </p>

            {/* Role selector card */}
            <div style={{ background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 20px", marginBottom: "20px", transition: "background 0.3s", overflowY: "auto", maxHeight: "500px" }}>
              <label style={{ ...labelStyle, marginBottom: "12px", color: "#ffffff" }}>
                I am registering as <span style={{ color: "#ef4444" }}></span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ROLES.map((r) => (
                  <label key={r.value} style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "8px 12px", borderRadius: "6px", transition: "background 0.2s", background: selectedRole === r.value ? "rgba(255,255,255,0.15)" : "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedRole === r.value ? "rgba(255,255,255,0.15)" : "transparent")}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={selectedRole === r.value}
                      onChange={(e) => setSelectedRole(e.target.value as RoleValue)}
                      style={{ marginTop: "3px", accentColor: "#ffffff", cursor: "pointer" }}
                    />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0 0 2px 0" }}>{r.label}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: 0 }}>{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              <div style={{ background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 16px", transition: "background 0.3s" }}>
                <ShieldCheck size={20} style={{ color: "#ffffff", marginBottom: "10px" }} />
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: "6px" }}>
                  Institutional Access
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
                  SSO integration for participating universities.
                </p>
              </div>
              <div style={{ background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #000000 0%, #2d2533 100%))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 16px", transition: "background 0.3s" }}>
                <BookCopy size={20} style={{ color: "#ffffff", marginBottom: "10px" }} />
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: "6px" }}>
                  Research Vaults
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
                  High-fidelity digitized primary sources.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Form card ── */}
          <div style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(229, 231, 235, 0.9)", borderRadius: "12px", padding: "clamp(20px, 5vw, 36px)", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", minWidth: "280px", maxWidth: "100%", overflowX: "hidden" }}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Row 1: Full Name + Email */}
              <div className="register-form-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder=""
                    aria-invalid={!!errors.name}
                    style={inputStyle(!!errors.name)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#111827"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,0.07)"; }}
                    {...register("name", { onBlur: (e) => { e.currentTarget.style.borderColor = errors.name ? "#ef4444" : "#d1d5db"; e.currentTarget.style.boxShadow = "none"; } })}
                  />
                  {errors.name && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder=""
                    aria-invalid={!!errors.email}
                    style={inputStyle(!!errors.email)}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#111827"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,0.07)"; }}
                    {...register("email", { onBlur: (e) => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#d1d5db"; e.currentTarget.style.boxShadow = "none"; } })}
                  />
                  {errors.email && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Department */}
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Department / Faculty</label>
                <input
                  type="text"
                  placeholder=""
                  aria-invalid={!!errors.department}
                  style={inputStyle(!!errors.department)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#111827"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,0.07)"; }}
                  {...register("department", { onBlur: (e) => { e.currentTarget.style.borderColor = errors.department ? "#ef4444" : "#d1d5db"; e.currentTarget.style.boxShadow = "none"; } })}
                />
                {errors.department && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.department.message}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    aria-invalid={!!errors.password}
                    style={{ ...inputStyle(!!errors.password), paddingRight: "42px" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#111827"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,24,39,0.07)"; }}
                    {...register("password", {
                      onChange: (e) => setPasswordValue(e.target.value),
                      onBlur: (e) => { e.currentTarget.style.borderColor = errors.password ? "#ef4444" : "#d1d5db"; e.currentTarget.style.boxShadow = "none"; },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordChecklist password={watchedPassword || passwordValue} />
              </div>

              {/* Terms checkbox */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: "2px", width: "14px", height: "14px", flexShrink: 0, accentColor: "#111827", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
                    I agree to the{" "}
                    <Link href="/terms" style={{ color: "#374151", fontWeight: 600, textDecoration: "underline" }}>Terms of Service</Link>
                    {" "}and acknowledge the{" "}
                    <Link href="/privacy" style={{ color: "#374151", fontWeight: 600, textDecoration: "underline" }}>Privacy Policy</Link>
                    {" "}concerning intellectual property and data archival.
                  </span>
                </label>
              </div>

              {/* Server error */}
              {error && (
                <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626" }} role="alert">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
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
                  opacity: isSubmitting ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                {isSubmitting && (
                  <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Create Academic Profile
              </button>

              {/* OR divider */}
              <div
                style={{ margin: "20px 0", display: "flex", alignItems: "center" }}
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

              {/* OAuth buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <button
                  type="button"
                  style={{
                    width: "100%",
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                  onClick={handleGoogleSignIn}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>

                <button
                  type="button"
                  style={{
                    width: "100%",
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                  onClick={() => {
                    setOauthProvider("sso");
                    setOauthModalOpen(true);
                  }}
                >
                  <ShieldCheck size={16} color="#374151" />
                  Sign up with Institutional SSO
                </button>
              </div>

              {/* Sign in link */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Already registered?{" "}
                <Link href="/login" style={{ fontWeight: 700, color: "#111827", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  Sign In here.
                </Link>
              </p>
            </form>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "rgba(233, 235, 238, 0.75)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", borderTop: "1px solid rgba(209, 213, 219, 0.8)", position: "relative", zIndex: 2 }} className="register-footer">
        <div className="register-footer-content" style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 32px", display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", gap: "16px" }}>
          <div>
            <p className="register-footer-brand" style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>Digital Knowledge Platform</p>
            <p className="register-footer-copyright" style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>© 2024 Digital Knowledge Platform. All rights reserved.</p>
          </div>
          <div className="register-footer-links" style={{ display: "flex", justifyContent: "flex-end", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Institutional Access", "Contact Support"].map((l) => (
              <Link key={l} href="#" style={{ fontSize: "13px", color: "#495057", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <MockOAuthModal
        isOpen={oauthModalOpen}
        onClose={() => setOauthModalOpen(false)}
        provider={oauthProvider}
        onAuthorize={handleOAuthAuthorize}
      />

      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

      <style>{`
        input[type="radio"] {
          accent-color: #000000 !important;
          cursor: pointer;
        }
        input[type="checkbox"] {
          accent-color: #000000 !important;
        }
      `}</style>
    </div>
  );
}
