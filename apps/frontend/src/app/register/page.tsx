"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/\d/, "Must contain a digit")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
  department: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.post("/auth/register", data);
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })?.response?.data;
      if (response?.errors?.length) {
        setError(response.errors.map((e) => e.msg).join(" · "));
      } else {
        setError(response?.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-fg-default)" }}>Create your account</h1>
          <p style={{ color: "var(--color-fg-muted)", marginTop: "0.25rem" }}>Join the Digital Knowledge Platform</p>
        </div>

        <div style={{ background: "var(--color-canvas-default)", borderRadius: "0.5rem", border: "1px solid var(--color-border-default)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="e.g. Computer Science and Engineering"
              {...register("department")}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
              hint="8+ chars with uppercase, lowercase, digit, and special character"
            />

            {error && (
              <div style={{ background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-fg)", borderRadius: "0.375rem", padding: "0.75rem 1rem", fontSize: "14px", color: "var(--color-danger-fg)" }}>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--color-fg-muted)", marginTop: "1.5rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-accent-fg)", fontWeight: "500" }} className="hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
