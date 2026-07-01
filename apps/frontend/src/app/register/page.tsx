"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, BookCopy, GraduationCap } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// ── Role options ──────────────────────────────────────────────────────────────
// Only non-privileged roles are available for self-service registration.
// Archivist / librarian / admin accounts are created by an admin via the admin panel.
const ROLES = [
  { value: "member",         label: "Member",         desc: "Browse and access published content" },
  { value: "student_author", label: "Student Author",  desc: "Submit projects to the showcase" },
  { value: "researcher",     label: "Researcher",      desc: "Publish research outputs and manage labs" },
] as const;
type RoleValue = typeof ROLES[number]["value"];

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters"),
  email:      z.string().email("Valid email required"),
  department: z.string().optional(),
  password:   z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Uppercase letter required")
    .regex(/[a-z]/, "Lowercase letter required")
    .regex(/\d/, "Digit required")
    .regex(/[@$!%*?&]/, "Special character required"),
});
type FormData = z.infer<typeof schema>;

// ── Password strength checklist ───────────────────────────────────────────────
function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",     ok: password.length >= 8 },
    { label: "Uppercase letter",  ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter",  ok: /[a-z]/.test(password) },
    { label: "One digit (0-9)",   ok: /\d/.test(password) },
    { label: "Special (@$!%*?&)", ok: /[@$!%*?&]/.test(password) },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: "10px" }}>
      {checks.map(c => (
        <label key={c.label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", color: "#6b7280", cursor: "default" }}>
          <span style={{
            width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
            border: `1.5px solid ${c.ok ? "var(--avatar-theme-color, #111827)" : "#d1d5db"}`,
            background: c.ok ? "var(--avatar-theme-color, #111827)" : "transparent",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
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

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  display: "block", width: "100%", padding: "10px 12px",
  fontSize: "13px", color: "#111827", background: "#ffffff",
  border: `1.5px solid ${hasError ? "#ef4444" : "#e5e7eb"}`,
  borderRadius: "7px", outline: "none", boxShadow: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
});

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11.5px", fontWeight: 600,
  color: "#374151", marginBottom: "6px",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [error,         setError]         = useState("");
  const [selectedRole,  setSelectedRole]  = useState<RoleValue>("member");
  const [showPassword,  setShowPassword]  = useState(false);
  const [agreed,        setAgreed]        = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  // OTP verification step
  const [step,          setStep]          = useState<"register" | "verify" | "pending">("register");
  const [pendingEmail,  setPendingEmail]  = useState("");
  const [otp,           setOtp]           = useState("");
  const [otpError,      setOtpError]      = useState("");
  const [verifying,     setVerifying]     = useState(false);
  const [resending,     setResending]     = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: FormData) => {
    if (!agreed) { setError("You must agree to the Terms of Service to continue."); return; }
    setError("");
    try {
      const res = await api.post("/auth/register", { ...data, role: selectedRole });
      const result = res.data.data;
      if (result.requiresVerification) {
        setPendingEmail(result.email);
        setStep("verify");
        toast.success(`Verification code sent to ${result.email}`);
      } else {
        // Fallback: direct login (dev mode without email restriction)
        localStorage.setItem("access_token", result.access_token);
        localStorage.setItem("refresh_token", result.refresh_token);
        setUser(result.user);
        toast.success("Account created successfully!");
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })?.response?.data;
      if (response?.errors?.length) {
        setError(response.errors.map((e: { msg: string }) => e.msg).join(" · "));
      } else {
        setError(response?.message || "Registration failed. Please try again.");
      }
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
    setOtpError(""); setVerifying(true);
    try {
      const res = await api.post("/auth/verify-email", { email: pendingEmail, otp });
      const result = res.data.data;
      if (result.pendingApproval) {
        setStep("pending");
      } else {
        localStorage.setItem("access_token", result.access_token);
        localStorage.setItem("refresh_token", result.refresh_token);
        setUser(result.user);
        toast.success("Email verified! Welcome to DKP.");
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setOtpError(response?.message || "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: pendingEmail });
      toast.success("New verification code sent!");
      setOtp(""); setOtpError("");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleOAuthAuthorize = async (oauthData: {
    email: string; name: string; role: string;
    provider: "google" | "sso"; providerId: string; department?: string;
  }) => {
    try {
      const res = await api.post("/auth/oauth-login", oauthData);
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success(`Welcome, ${user.name}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sign up via OAuth");
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }
    if (typeof window !== "undefined" && (window as any).google) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const t = toast.loading("Fetching Google profile…");
              try {
                const profileRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
                const profile = await profileRes.json();
                toast.dismiss(t);
                await handleOAuthAuthorize({
                  email: profile.email, name: profile.name,
                  role: selectedRole, provider: "google",
                  providerId: `google_${profile.sub}`, department: "",
                });
              } catch {
                toast.dismiss(t);
                toast.error("Failed to fetch Google profile");
              }
            }
          },
        });
        client.requestAccessToken();
      } catch {
        toast.error("Failed to initialize Google Sign-In SDK");
      }
    } else {
      toast.error("Google SDK is still loading. Please try again.");
    }
  };

  /* ── OTP step ── */
  if (step === "verify") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "40px 36px", maxWidth: "420px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Verify your email</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              We sent a 6-digit code to <strong>{pendingEmail}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              style={{ width: "100%", textAlign: "center", fontSize: "32px", fontWeight: 800, letterSpacing: "12px", padding: "14px 12px", border: `2px solid ${otpError ? "#ef4444" : "#e5e7eb"}`, borderRadius: "10px", outline: "none" }}
            />
          </div>
          {otpError && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>{otpError}</p>}
          <button
            onClick={onVerifyOtp}
            disabled={verifying || otp.length !== 6}
            style={{ width: "100%", padding: "13px", background: "var(--avatar-theme-color, #111827)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: otp.length === 6 ? "pointer" : "not-allowed", opacity: otp.length !== 6 ? 0.5 : 1, marginBottom: "12px" }}
          >
            {verifying ? "Verifying…" : "Verify & Continue"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button onClick={onResend} disabled={resending} style={{ background: "none", border: "none", fontSize: "13px", color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Pending approval step (researcher) ── */
  if (step === "pending") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
        <div style={{ background: "#fff", borderRadius: "14px", padding: "40px 36px", maxWidth: "440px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: "24px" }}>⏳</span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "0 0 12px" }}>Awaiting approval</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" }}>
            Your email is verified. Your <strong>Researcher</strong> account is now under review by the platform administrator.
            You will receive an email at <strong>{pendingEmail}</strong> once your account is approved.
          </p>
          <Link href="/login" style={{ display: "inline-block", padding: "11px 28px", background: "var(--avatar-theme-color, #111827)", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        input[type="radio"]    { accent-color: var(--avatar-theme-color, #111827) !important; cursor: pointer; }
        input[type="checkbox"] { accent-color: var(--avatar-theme-color, #111827) !important; }
        .reg-input:focus { border-color: var(--avatar-theme-color, #111827) !important; box-shadow: 0 0 0 3px rgba(17,24,39,0.07) !important; }
        .reg-cols { display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; align-items: stretch; }
        @media (max-width: 720px) { .reg-cols { grid-template-columns: 1fr; } }
      `}} />

      {/* ── Nav ── */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "980px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
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
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "0 24px 60px" }}>

        {/* ── Centered Hero ── */}
        <div style={{ textAlign: "center", padding: "44px 20px 32px", maxWidth: "560px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 800, color: "#0f1117", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 12px 0" }}>
            Join the Platform.
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
            The University of Dhaka&apos;s academic knowledge hub — built for students, faculty, and researchers.
          </p>
        </div>

        {/* ── Two matched boxes ── */}
        <div style={{ maxWidth: "980px", margin: "0 auto" }} className="reg-cols">

          {/* ── LEFT BOX — Role selector ── */}
          <div style={{
            background: "var(--theme-sidebar-gradient, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}>
            {/* Role header */}
            <div>
              <p style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", margin: "0 0 14px 0" }}>
                I am registering as
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "10px 12px", borderRadius: "8px", transition: "background 0.15s", background: selectedRole === r.value ? "rgba(255,255,255,0.12)" : "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = selectedRole === r.value ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedRole === r.value ? "rgba(255,255,255,0.12)" : "transparent")}
                  >
                    <input type="radio" name="role" value={r.value} checked={selectedRole === r.value}
                      onChange={e => setSelectedRole(e.target.value as RoleValue)}
                      style={{ marginTop: "3px", cursor: "pointer" }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0 0 2px 0" }}>{r.label}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: 0 }}>{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info cards pinned at bottom */}
            <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px 12px" }}>
                <GraduationCap size={18} style={{ color: "rgba(255,255,255,0.7)", marginBottom: "8px" }} />
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#ffffff", margin: "0 0 5px 0" }}>Academic</p>
                <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, margin: 0 }}>Connect with FET faculty and researchers.</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px 12px" }}>
                <BookCopy size={18} style={{ color: "rgba(255,255,255,0.7)", marginBottom: "8px" }} />
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#ffffff", margin: "0 0 5px 0" }}>Vaults</p>
                <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, margin: 0 }}>Digitized primary academic sources.</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT BOX — Form ── */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "28px 28px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
          }}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", flex: 1 }}>

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" autoComplete="name" className="reg-input"
                    aria-invalid={!!errors.name} style={inputStyle(!!errors.name)}
                    {...register("name", {
                      onBlur: e => { e.currentTarget.style.borderColor = errors.name ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }
                    })} />
                  {errors.name && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" autoComplete="email" className="reg-input"
                    aria-invalid={!!errors.email} style={inputStyle(!!errors.email)}
                    {...register("email", {
                      onBlur: e => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }
                    })} />
                  {errors.email && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>{errors.email.message}</p>}
                </div>
              </div>

              {/* Department */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Department / Faculty <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                <input type="text" placeholder="e.g. Computer Science & Engineering" className="reg-input"
                  style={inputStyle()} {...register("department", {
                    onBlur: e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }
                  })} />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password"
                    placeholder="••••••••••••" aria-invalid={!!errors.password} className="reg-input"
                    style={{ ...inputStyle(!!errors.password), paddingRight: "42px" }}
                    {...register("password", {
                      onChange: e => setPasswordValue(e.target.value),
                      onBlur: e => { e.currentTarget.style.borderColor = errors.password ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; },
                    })} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9ca3af", display: "flex", alignItems: "center" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordChecklist password={watchedPassword || passwordValue} />
              </div>

              {/* Terms */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: "2px", width: "14px", height: "14px", flexShrink: 0, cursor: "pointer" }} />
                  <span style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
                    I agree to the{" "}
                    <Link href="/terms" style={{ color: "#374151", fontWeight: 600, textDecoration: "underline" }}>Terms of Service</Link>
                    {" "}and acknowledge the{" "}
                    <Link href="/privacy" style={{ color: "#374151", fontWeight: 600, textDecoration: "underline" }}>Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626" }} role="alert">
                  {error}
                </div>
              )}

              {/* Push remaining to bottom */}
              <div style={{ marginTop: "auto" }}>
                {/* Submit */}
                <button type="submit" disabled={isSubmitting}
                  style={{
                    width: "100%", padding: "12px 16px", fontSize: "13.5px", fontWeight: 700,
                    background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                    border: "none", borderRadius: "8px",
                    cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.65 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginBottom: "14px", transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.opacity = "0.87"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = isSubmitting ? "0.65" : "1"; }}
                >
                  {isSubmitting && (
                    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Create Account
                </button>

                {/* OR */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                  <span style={{ padding: "0 12px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                </div>

                {/* Google */}
                <button type="button" onClick={handleGoogleSignIn}
                  style={{
                    width: "100%", padding: "11px 16px", fontSize: "13.5px", fontWeight: 600,
                    background: "#ffffff", color: "#374151",
                    border: "1.5px solid #e5e7eb", borderRadius: "8px",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    marginBottom: "18px", transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Sign in link */}
                <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: 0 }}>
                  Already have an account?{" "}
                  <Link href="/login" style={{ fontWeight: 700, color: "#111827", textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Sign In
                  </Link>
                </p>
              </div>

            </form>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff", marginTop: "auto" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
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

      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
    </div>
  );
}
