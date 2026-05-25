"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, ShieldCheck, BookCopy } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// ── Role options ──────────────────────────────────────────────────────────────
const ROLES = [
  { value: "member",         label: "Member",         desc: "Browse and access published content" },
  { value: "student_author", label: "Student Author", desc: "Submit projects to the showcase" },
  { value: "researcher",     label: "Researcher",     desc: "Publish research outputs and manage labs" },
  { value: "archivist",      label: "Archivist",      desc: "Upload and manage archive documents" },
  { value: "librarian",      label: "Librarian",      desc: "Manage library catalog and lending" },
] as const;
type RoleValue = typeof ROLES[number]["value"];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Business Administration",
  "Economics",
  "English",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Law",
  "Medicine",
  "Other",
];

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

// ── Password strength checker ─────────────────────────────────────────────────
function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",       ok: password.length >= 8 },
    { label: "Uppercase letter",     ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter",     ok: /[a-z]/.test(password) },
    { label: "One digit (0-9)",      ok: /\d/.test(password) },
    { label: "Special (@$!%*?&)",    ok: /[@$!%*?&]/.test(password) },
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
  const [error, setError]             = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleValue>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

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
      router.push("/dashboard");
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })?.response?.data;
      if (response?.errors?.length) {
        setError(response.errors.map((e: { msg: string }) => e.msg).join(" · "));
      } else {
        setError(response?.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#eef0f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      

      {/* ── Navbar ── */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px" }}>
          <Link href="/" style={{ fontSize: "14px", fontWeight: 700, color: "#111827", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Digital Knowledge Platform
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { label: "Archive", href: "/archive" },
              { label: "Library", href: "/library" },
              { label: "Research", href: "/research" },
              { label: "About", href: "/about" },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{ padding: "6px 13px", fontSize: "13px", fontWeight: 500, color: "#495057", textDecoration: "none", borderRadius: "6px" }}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/login" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 500, color: "#374151", textDecoration: "none", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}>
              Sign In
            </Link>
            <Link href="/register" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, color: "#ffffff", background: "#111827", borderRadius: "6px", textDecoration: "none" }}>
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "48px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "340px 1fr", gap: "40px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#111827", lineHeight: 1.15, marginBottom: "16px", letterSpacing: "-0.02em" }}>
              Join the Archive.
            </h1>
            <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, marginBottom: "28px" }}>
              Establish your scholarly presence within the Digital Knowledge Platform. Access exclusive research repositories, contribute to peer-reviewed collections, and collaborate with global academic institutions.
            </p>

            {/* Role selector card */}
            <div style={{ background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 20px", marginBottom: "20px" }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 16px" }}>
                <ShieldCheck size={20} style={{ color: "#ffffff", marginBottom: "10px" }} />
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: "6px" }}>
                  Institutional Access
                </p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
                  SSO integration for participating universities.
                </p>
              </div>
              <div style={{ background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "18px 16px" }}>
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
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "36px 36px 32px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Row 1: Full Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Dr. Julian Archer"
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
                    placeholder="j.archer@institution.edu"
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "220px", overflowY: "auto", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb" }}>
                  {DEPARTMENTS.map((d) => {
                    const dept = watch("department") || "";
                    return (
                      <label key={d} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px 10px", borderRadius: "4px", background: dept === d ? "#000000" : "transparent", transition: "all 0.2s" }}
                        onMouseEnter={(e) => !dept || dept !== d ? (e.currentTarget.style.background = "#e5e5e5") : null}
                        onMouseLeave={(e) => (e.currentTarget.style.background = dept === d ? "#000000" : "transparent")}
                      >
                        <input
                          type="radio"
                          {...register("department")}
                          value={d}
                          style={{ accentColor: "#111827", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: dept === d ? "#ffffff" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</span>
                      </label>
                    );
                  })}
                </div>
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
      <footer style={{ background: "#e9ebee", borderTop: "1px solid #d1d5db" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 32px", display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>Digital Knowledge Platform</p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>© 2024 Digital Knowledge Platform. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "24px" }}>
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
