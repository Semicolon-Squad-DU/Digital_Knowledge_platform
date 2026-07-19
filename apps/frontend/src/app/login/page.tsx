"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, EyeOff, Library, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { C, SERIF, SANS } from "@/components/design/dkpTheme";
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

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<{ email: string; name: string; sub: string } | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleValue>("member");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

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

  const attemptOAuthLogin = async (accessToken: string, role?: RoleValue) => {
    const res = await api.post("/auth/oauth-login", {
      accessToken, provider: "google",
      ...(role ? { role, department: "" } : {}),
    });
    return res.data.data;
  };

  const completeLogin = (data: { access_token: string; refresh_token: string; user: { name: string; role: string } }) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user as any);
    toast.success(`Welcome back, ${data.user.name}!`);
    router.push(redirectParam ?? roleHome(data.user.role));
  };

  const handleGoogleSignIn = async () => {
    const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
    const { firebaseAuth, googleProvider } = await import("@/lib/firebase");

    let accessToken: string | null = null;
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider());
      // The Google OAuth access token (not Firebase's ID token) is what the
      // backend verifies via Google's userinfo endpoint — see oauth-login.
      accessToken = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        return; // user dismissed the popup — not an error worth surfacing
      }
      if (err?.code === "auth/popup-blocked") {
        toast.error("Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.");
      } else {
        toast.error("Google sign-in was cancelled or failed. Please try again.");
      }
      return;
    }

    if (!accessToken) {
      toast.error("Could not retrieve Google credentials. Please try again.");
      return;
    }

    const t = toast.loading("Signing you in…");
    try {
      const data = await attemptOAuthLogin(accessToken);
      toast.dismiss(t);
      if (data.requiresRole) {
        setGoogleProfile({ email: data.email, name: data.name, sub: "" });
        setGoogleAccessToken(accessToken);
        setSelectedRole("member");
        setShowRoleModal(true);
      } else {
        completeLogin(data);
      }
    } catch (err: any) {
      toast.dismiss(t);
      toast.error(err?.response?.data?.message || "Google sign-in failed");
    }
  };

  const handleRoleConfirm = async () => {
    if (!googleAccessToken) return;
    setRoleError("");
    setIsSubmittingRole(true);
    try {
      const data = await attemptOAuthLogin(googleAccessToken, selectedRole);
      completeLogin(data);
      setShowRoleModal(false);
      setGoogleProfile(null);
      setGoogleAccessToken(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to complete sign-in";
      setRoleError(msg);
      setIsSubmittingRole(false);
      toast.error(msg);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16,
    color: C.ink, background: C.white, border: `1.5px solid ${hasError ? "#ef4444" : C.lineStrong}`,
    borderRadius: 8, outline: "none", fontFamily: SANS,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: SANS, background: C.white }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-auth-panel { display: none !important; }
          .dkp-auth-form { padding: 32px 20px !important; }
        }
      `}} />

      {/* Left brand panel */}
      <aside
        className="dkp-auth-panel"
        style={{
          flex: "1 1 50%", position: "relative", minHeight: "100vh",
          background: C.ink, color: C.white, overflow: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
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
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Platform
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 440, paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Library size={22} />
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700 }}>DU DKP</span>
          </div>
          <h1 style={{
            fontFamily: SERIF, fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 700,
            margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            DU Digital<br />Knowledge Platform
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", margin: 0 }}>
            Access the premier institutional repository for research, archives, and scholarly communication at the University of Dhaka.
          </p>
        </div>
      </aside>

      {/* Right form */}
      <main className="dkp-auth-form" style={{ flex: "1 1 50%", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px clamp(20px, 5vw, 64px)", background: C.white }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 700, color: C.ink, margin: "0 0 28px" }}>
            Sign In
          </h2>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px 16px", fontSize: 14, fontWeight: 700, background: C.white, color: C.accent,
              border: `1.5px solid ${C.lineStrong}`, borderRadius: 8, cursor: "pointer", marginBottom: 22,
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: C.lineStrong }} />
            <span style={{ padding: "0 14px", fontSize: 12, fontWeight: 600, color: C.body, letterSpacing: "0.06em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.lineStrong }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="login-email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
                Institutional Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="user@du.ac.bd"
                aria-invalid={!!errors.email}
                style={inputStyle(!!errors.email)}
                {...register("email")}
              />
              {errors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }} role="alert">{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: "none" }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.body, display: "flex", padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }} role="alert">{errors.password.message}</p>}
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 12px", fontSize: 13, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626" }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%", padding: "14px 16px", fontSize: 15, fontWeight: 700,
                background: C.ink, color: C.white, border: "none", borderRadius: 8,
                cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: C.body, margin: "24px 0 0" }}>
            New to the platform?{" "}
            <Link href="/register" style={{ fontWeight: 700, color: C.accent, textDecoration: "none" }}>
              Create an Account
            </Link>
          </p>
        </div>
      </main>

      {showRoleModal && googleProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>Select Your Role</h2>
                <p style={{ fontSize: 13, color: C.body, margin: 0 }}>Choose how you&apos;ll use the platform</p>
              </div>
              <button onClick={() => { setShowRoleModal(false); setGoogleProfile(null); setGoogleAccessToken(null); setRoleError(""); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.body }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: C.chip, border: `1px solid ${C.lineStrong}`, borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: C.body, margin: "0 0 3px" }}>Signing in as</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0 }}>{googleProfile.name} · {googleProfile.email}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {ROLES.map((role) => (
                <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                  style={{
                    padding: "12px 14px", textAlign: "left", cursor: "pointer", borderRadius: 10,
                    border: `1.5px solid ${selectedRole === role.value ? C.ink : C.lineStrong}`,
                    background: selectedRole === role.value ? C.chip : C.white,
                  }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, margin: "0 0 2px" }}>{role.label}</p>
                  <p style={{ fontSize: 12, color: C.body, margin: 0 }}>{role.desc}</p>
                </button>
              ))}
            </div>

            {roleError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{roleError}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setShowRoleModal(false); setGoogleProfile(null); setGoogleAccessToken(null); setRoleError(""); }} disabled={isSubmittingRole}
                style={{ flex: 1, padding: "11px 16px", fontSize: 13, fontWeight: 600, background: C.chip, color: C.ink, border: "none", borderRadius: 8, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={handleRoleConfirm} disabled={isSubmittingRole}
                style={{ flex: 1, padding: "11px 16px", fontSize: 13, fontWeight: 700, background: C.ink, color: C.white, border: "none", borderRadius: 8, cursor: isSubmittingRole ? "not-allowed" : "pointer", opacity: isSubmittingRole ? 0.7 : 1 }}>
                {isSubmittingRole ? "Continuing…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: SANS, color: C.body }}>
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
