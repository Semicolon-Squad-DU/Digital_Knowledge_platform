"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((m) => m.Player),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Role options
// ---------------------------------------------------------------------------

const ROLES = [
  {
    value: "member",
    label: "Member",
    description: "Browse and access published content",
  },
  {
    value: "student_author",
    label: "Student Author",
    description: "Submit projects to the showcase",
  },
  {
    value: "researcher",
    label: "Researcher",
    description: "Publish research outputs and manage labs",
  },
  {
    value: "archivist",
    label: "Archivist",
    description: "Upload and manage archive documents",
  },
  {
    value: "librarian",
    label: "Librarian",
    description: "Manage library catalog and lending",
  },
] as const;

type RoleValue = typeof ROLES[number]["value"];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters"),
  email:      z.string().email("Valid email required"),
  password:   z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/\d/, "Must contain a digit")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
  department: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError]       = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleValue>("member");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
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
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "linear-gradient(to right, #A8D5A8 0%, #A8D5A8 50%, #ffffff 50%, #ffffff 100%)", padding: "0", margin: "0", overflow: "hidden" }}
    >
      <div className="w-full flex items-center justify-between gap-8" style={{ maxWidth: "1200px", height: "100%", paddingX: "1rem", paddingY: "3rem" }}>
        {/* Left — Form */}
        <div style={{ flex: "0 0 auto", width: "100%", maxWidth: "450px" }}>

          {/* Logo */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ background: "var(--color-canvas-default)", border: "1px solid var(--color-border-default)" }}
            >
              <BookOpen size={22} style={{ color: "var(--color-fg-default)" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--color-fg-default)" }}>
              Create your account
            </h1>
          </div>

          {/* Form card */}
          <div
            className="rounded-md border p-5 space-y-4"
            style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Basic fields */}
              <Input
                label="Full Name"
                required
                autoComplete="name"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Email address"
                type="email"
                required
                autoComplete="email"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Department"
                placeholder="e.g. Computer Science & Engineering"
                {...register("department")}
              />
              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                {...register("password")}
                error={errors.password?.message}
                hint="8+ chars with uppercase, lowercase, digit, and special character (@$!%*?&)"
              />

              {/* Role selector */}
              <div>
                <label className="form-label">
                  I am registering as <span className="text-[var(--color-danger-fg)]">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleValue)}
                  className="form-select"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} — {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                loading={isSubmitting}
                style={{ background: "#1a7f5a", borderColor: "#1a7f5a" }}
              >
                Create Account
              </Button>
            </form>
          </div>

          {/* Sign in link */}
          <div
            className="mt-3 text-center text-sm py-4 rounded-md border"
            style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)", color: "var(--color-fg-muted)" }}
          >
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#1a7f5a" }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Right — Animation */}
        {isClient && (
          <div style={{ flex: "1", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "400px", paddingRight: "40px" }}>
            <Player
              autoplay
              loop
              src="/Little bit Of Reading.json"
              style={{ height: "600px", width: "600px", transform: "translateX(200px)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
