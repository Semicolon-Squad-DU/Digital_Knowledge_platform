"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Eye, EyeOff, Library, GraduationCap, FlaskConical,
  UserRound, BadgeCheck, Archive, ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { C, SERIF, SANS } from "@/components/design/dkpTheme";

const ROLES = [
  { value: "member",         label: "Member",         desc: "Browse published content", approvalRequired: false, icon: UserRound },
  { value: "student_author", label: "Student",        desc: "Submit showcase projects", approvalRequired: false, icon: GraduationCap },
  { value: "researcher",     label: "Researcher",     desc: "Publish research outputs", approvalRequired: true,  icon: FlaskConical },
  { value: "archivist",      label: "Archivist",      desc: "Manage archive documents", approvalRequired: true,  icon: Archive },
  { value: "librarian",      label: "Staff",          desc: "Library catalog & lending", approvalRequired: true,  icon: BadgeCheck },
  { value: "admin",          label: "Admin",          desc: "Full platform access", approvalRequired: true,  icon: ShieldCheck },
] as const;
type RoleValue = typeof ROLES[number]["value"];

const FACULTIES = [
  "Faculty of Arts",
  "Faculty of Science",
  "Faculty of Law",
  "Faculty of Business Studies",
  "Faculty of Social Sciences",
  "Faculty of Biological Sciences",
  "Faculty of Engineering & Technology",
  "Faculty of Fine Arts",
  "Faculty of Earth & Environmental Sciences",
  "Faculty of Pharmacy",
];

function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

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

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Digit", ok: /\d/.test(password) },
    { label: "Special (@$!%*?&)", ok: /[@$!%*?&]/.test(password) },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
      {checks.map((c) => (
        <span key={c.label} style={{ fontSize: 12, color: c.ok ? C.accent : C.body, fontWeight: c.ok ? 600 : 500 }}>
          {c.ok ? "✓" : "○"} {c.label}
        </span>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleValue>("student_author");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const [step, setStep] = useState<"register" | "verify" | "pending">("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingRole, setPendingRole] = useState<RoleValue>("member");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

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
        setPendingRole(result.role);
        setStep("verify");
        toast.success(`Verification code sent to ${result.email}`);
      } else {
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
    idToken: string; role: string; provider: "google"; department?: string;
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

  const handleGoogleSignIn = async () => {
    const { signInWithPopup } = await import("firebase/auth");
    const { firebaseAuth, googleProvider, firebaseAuthErrorMessage } = await import("@/lib/firebase");

    let idToken: string | null = null;
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider());
      // The backend verifies the Firebase ID token (RS256, signed by Google)
      // against the Firebase project — see oauth-login / verifyFirebaseIdToken.
      idToken = await result.user.getIdToken();
    } catch (err: unknown) {
      const { FIREBASE_POPUP_DISMISSED } = await import("@/lib/firebase");
      const msg = firebaseAuthErrorMessage(err);
      if (msg !== FIREBASE_POPUP_DISMISSED) toast.error(msg);
      return;
    }

    if (!idToken) {
      toast.error("Could not retrieve Google credentials. Please try again.");
      return;
    }

    await handleOAuthAuthorize({
      idToken,
      role: selectedRole, provider: "google", department: "",
    });
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16,
    color: C.ink, background: C.white, border: `1.5px solid ${hasError ? "#ef4444" : C.lineStrong}`,
    borderRadius: 8, outline: "none", fontFamily: SANS,
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8,
  };

  if (step === "verify") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: SANS, padding: 20 }}>
        <div style={{ background: C.white, borderRadius: 14, padding: "40px 36px", maxWidth: 420, width: "100%", boxShadow: "0 4px 24px rgba(26,26,46,0.08)", border: `1px solid ${C.lineStrong}` }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>Verify your email</h2>
            <p style={{ fontSize: 14, color: C.body, margin: 0 }}>
              We sent a 6-digit code to <strong>{pendingEmail}</strong>
            </p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            style={{ width: "100%", textAlign: "center", fontSize: 32, fontWeight: 800, letterSpacing: 12, padding: "14px 12px", border: `2px solid ${otpError ? "#ef4444" : C.lineStrong}`, borderRadius: 10, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
          />
          {otpError && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{otpError}</p>}
          <button
            type="button"
            onClick={onVerifyOtp}
            disabled={verifying || otp.length !== 6}
            style={{ width: "100%", padding: 13, background: C.ink, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: otp.length === 6 ? "pointer" : "not-allowed", opacity: otp.length !== 6 ? 0.5 : 1, marginBottom: 12 }}
          >
            {verifying ? "Verifying…" : "Verify & Continue"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={onResend} disabled={resending} style={{ background: "none", border: "none", fontSize: 13, color: C.body, cursor: "pointer", textDecoration: "underline" }}>
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pending") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: SANS, padding: 20 }}>
        <div style={{ background: C.white, borderRadius: 14, padding: "40px 36px", maxWidth: 440, width: "100%", boxShadow: "0 4px 24px rgba(26,26,46,0.08)", border: `1px solid ${C.lineStrong}`, textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Awaiting approval</h2>
          <p style={{ fontSize: 14, color: C.body, lineHeight: 1.6, margin: "0 0 24px" }}>
            Your email is verified. Your <strong>{roleLabel(pendingRole)}</strong> account is now under review.
            You will receive an email at <strong>{pendingEmail}</strong> once approved.
          </p>
          <Link href="/login" style={{ display: "inline-block", padding: "11px 28px", background: C.ink, color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: SANS, background: C.white }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .dkp-reg-panel { display: none !important; }
          .dkp-reg-form { padding: 28px 18px !important; }
          .dkp-reg-roles { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}} />

      {/* Left brand panel */}
      <aside
        className="dkp-reg-panel"
        style={{
          flex: "0 0 42%", minHeight: "100vh", background: C.ink, color: C.white,
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "40px clamp(24px, 3vw, 48px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/auth-signup-panel.png"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22 }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: `
            linear-gradient(160deg, rgba(26,26,46,0.94) 0%, rgba(13,71,161,0.55) 100%),
            repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px),
            repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px)
          `,
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <Library size={22} />
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700 }}>DU Digital Knowledge Platform</span>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 420, paddingBottom: 28 }}>
          <h1 style={{
            fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 700,
            margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>
            Join the Digital Knowledge Platform
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", margin: 0 }}>
            Create an account to access, contribute, and collaborate on academic resources at the University of Dhaka.
          </p>
        </div>
      </aside>

      {/* Right form */}
      <main
        className="dkp-reg-form"
        style={{
          flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "40px clamp(18px, 4vw, 56px)", overflowY: "auto", maxHeight: "100vh",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, paddingBottom: 40 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 3.5vw, 34px)", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            Create Account
          </h2>
          <p style={{ fontSize: 14, color: C.body, margin: "0 0 28px" }}>
            Enter your details to register as a new user.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Role grid */}
            <div style={{ marginBottom: 22 }}>
              <p style={labelStyle}>Select Role</p>
              <div className="dkp-reg-roles" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRole(r.value)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                        padding: "14px 12px", textAlign: "left", cursor: "pointer", borderRadius: 10,
                        border: `1.5px solid ${active ? C.ink : C.lineStrong}`,
                        background: active ? C.chip : C.white,
                      }}
                    >
                      <Icon size={20} color={active ? C.accent : C.body} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{r.label}</span>
                      {r.approvalRequired && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>
                          Approval
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" autoComplete="name" placeholder="Dr. Muhammad Yunus" style={inputStyle(!!errors.name)} {...register("name")} />
              {errors.name && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{errors.name.message}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Institutional Email</label>
              <input type="email" autoComplete="email" placeholder="name@du.ac.bd" style={inputStyle(!!errors.email)} {...register("email")} />
              {errors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Department / Faculty</label>
              <select
                defaultValue=""
                style={{ ...inputStyle(), appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555f6d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}
                {...register("department")}
              >
                <option value="">Select your department...</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
                  {...register("password", {
                    onChange: (e) => setPasswordValue(e.target.value),
                  })}
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
              <p style={{ fontSize: 12, color: C.body, margin: "8px 0 0" }}>Must be at least 8 characters long.</p>
              <PasswordChecklist password={watchedPassword || passwordValue} />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 18 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: C.ink }} />
              <span style={{ fontSize: 13, color: C.body, lineHeight: 1.55 }}>
                I agree to the{" "}
                <Link href="/terms" style={{ color: C.accent, fontWeight: 600 }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" style={{ color: C.accent, fontWeight: 600 }}>Privacy Policy</Link>.
              </span>
            </label>

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
                cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.65 : 1, marginBottom: 14,
              }}
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>

            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: C.lineStrong }} />
              <span style={{ padding: "0 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.body }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.lineStrong }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: "100%", padding: "12px 16px", fontSize: 14, fontWeight: 600,
                background: C.white, color: C.ink, border: `1.5px solid ${C.lineStrong}`, borderRadius: 8,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: "center", fontSize: 14, color: C.body, margin: 0 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ fontWeight: 700, color: C.accent, textDecoration: "none" }}>Sign in</Link>
            </p>
          </form>
        </div>
      </main>

    </div>
  );
}
