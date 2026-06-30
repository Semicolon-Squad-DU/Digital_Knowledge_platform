"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { GraduationCap, LogIn, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

const ROLES = [
  { value: "member",         label: "Member",         desc: "Browse and access published content" },
  { value: "student_author", label: "Student Author",  desc: "Submit projects to the showcase" },
  { value: "researcher",     label: "Researcher",      desc: "Publish research outputs and manage labs" },
  { value: "archivist",      label: "Archivist",       desc: "Upload and manage archive documents" },
  { value: "librarian",      label: "Librarian",       desc: "Manage library catalog and lending" },
  { value: "admin",          label: "Admin",           desc: "Full platform access and user management" },
] as const;
type RoleValue = typeof ROLES[number]["value"];

const schema = z.object({
  email:    z.string().email("Valid email required"),
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

function roleHome(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "librarian") return "/librarian";
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { login, setUser } = useAuthStore();

  const [error,             setError]             = useState("");
  const [googleProfile,     setGoogleProfile]     = useState<{ email: string; name: string; sub: string } | null>(null);
  const [selectedRole,      setSelectedRole]      = useState<RoleValue>("member");
  const [showRoleModal,     setShowRoleModal]     = useState(false);
  const [roleError,         setRoleError]         = useState("");
  const [isSubmittingRole,  setIsSubmittingRole]  = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      const role = useAuthStore.getState().user?.role;
      router.push(redirectParam ?? roleHome(role));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Invalid email or password");
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
      toast.success(`Welcome back, ${user.name}!`);
      router.push(redirectParam ?? roleHome(user.role));
    } catch (err: any) {
      // Error is already handled in handleRoleConfirm
      throw err;
    }
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Sign-In is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }
    if (typeof window !== "undefined" && (window as { google?: { accounts?: { oauth2?: { initTokenClient: (config: object) => { requestAccessToken: () => void } } } } }).google) {
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
                setGoogleProfile(profile);
                setSelectedRole("member");
                setShowRoleModal(true);
              } catch {
                toast.dismiss(t);
                toast.error("Failed to fetch Google profile");
              }
            }
          },
        });
        client.requestAccessToken();
      } catch {
        toast.error("Failed to initialize Google Sign-In");
      }
    } else {
      toast.error("Google SDK is still loading. Please try again.");
    }
  };

  const handleRoleConfirm = async () => {
    if (!googleProfile) return;
    setRoleError("");
    setIsSubmittingRole(true);
    try {
      await handleOAuthAuthorize({
        email: googleProfile.email, name: googleProfile.name,
        role: selectedRole, provider: "google",
        providerId: `google_${googleProfile.sub}`, department: "",
      });
      setShowRoleModal(false);
      setGoogleProfile(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to complete sign-in";
      setRoleError(msg);
      setIsSubmittingRole(false);
      toast.error(msg);
    }
  };

  const inputBase: React.CSSProperties = {
    display: "block", width: "100%", padding: "10px 12px",
    fontSize: "13.5px", color: "#111827", background: "#ffffff",
    border: "1.5px solid #e5e7eb", borderRadius: "8px",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ── */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={13} color="#ffffff" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.01em" }}>DKP</span>
          </Link>
          <Link href="/register"
            style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
          >
            Create account
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
            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f1117", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 6px 0" }}>
                Sign In
              </h1>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Access your academic collections and research.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="login-email" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  style={{ ...inputBase, borderColor: errors.email ? "#ef4444" : "#e5e7eb" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color, #111827)"; }}
                  {...register("email", {
                    onBlur: e => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "#e5e7eb"; }
                  })}
                />
                {errors.email && <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }} role="alert">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="login-password" style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: "12px", color: "#6b7280", textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Forgot password?
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

              {/* Error */}
              {error && (
                <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626" }} role="alert">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "12px 16px", fontSize: "13.5px", fontWeight: 700,
                  background: "var(--avatar-theme-color, #111827)", color: "#ffffff",
                  border: "none", borderRadius: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.opacity = "0.87"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = isSubmitting ? "0.7" : "1"; }}
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <LogIn size={15} strokeWidth={2.5} />}
                Sign In
              </button>
            </form>

            {/* OR */}
            <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              <span style={{ padding: "0 12px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                padding: "11px 16px", fontSize: "13.5px", fontWeight: 600,
                background: "#ffffff", color: "#374151",
                border: "1.5px solid #e5e7eb", borderRadius: "8px",
                cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
              }}
              onClick={handleGoogleSignIn}
              onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider + Register link */}
            <div style={{ height: "1px", background: "#e5e7eb", margin: "24px 0 18px" }} />
            <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: 0 }}>
              New to the platform?{" "}
              <Link href="/register" style={{ fontWeight: 700, color: "#111827", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
              >
                Create an account
              </Link>
            </p>
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

      {/* ── Role Selection Modal for Google Sign-In ── */}
      {showRoleModal && googleProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflow: "auto", padding: "32px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>Select Your Role</h2>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Choose how you'll use the platform</p>
              </div>
              <button onClick={() => { setShowRoleModal(false); setGoogleProfile(null); setRoleError(""); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", color: "#9ca3af" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 3px 0" }}>Signing in as</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", margin: 0 }}>{googleProfile.name} · {googleProfile.email}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {ROLES.map(role => (
                <button key={role.value} onClick={() => setSelectedRole(role.value)}
                  style={{
                    padding: "12px 14px", textAlign: "left", cursor: "pointer", borderRadius: "10px",
                    border: `1.5px solid ${selectedRole === role.value ? "var(--avatar-theme-color, #111827)" : "#e5e7eb"}`,
                    background: selectedRole === role.value ? "#f8f9fa" : "#ffffff",
                    transition: "all 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color, #111827)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = selectedRole === role.value ? "var(--avatar-theme-color, #111827)" : "#e5e7eb"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 2px 0" }}>{role.label}</p>
                      <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{role.desc}</p>
                    </div>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${selectedRole === role.value ? "var(--avatar-theme-color, #111827)" : "#d1d5db"}`,
                      background: selectedRole === role.value ? "var(--avatar-theme-color, #111827)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
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

            {roleError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "#dc2626", margin: "0 0 6px 0", lineHeight: 1.5 }}>{roleError}</p>
                <p style={{ fontSize: "11px", color: "#991b1b", margin: 0 }}>
                  Your role is tied to your account. Contact an admin to change it.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowRoleModal(false); setGoogleProfile(null); setRoleError(""); }} disabled={isSubmittingRole}
                style={{ flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 600, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: isSubmittingRole ? "not-allowed" : "pointer" }}>
                Cancel
              </button>
              <button onClick={handleRoleConfirm} disabled={isSubmittingRole}
                style={{ flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 700, background: "var(--avatar-theme-color, #111827)", color: "#ffffff", border: "none", borderRadius: "8px", cursor: isSubmittingRole ? "not-allowed" : "pointer", opacity: isSubmittingRole ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {isSubmittingRole ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : "Continue"}
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8f9fa" }}>
        <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
