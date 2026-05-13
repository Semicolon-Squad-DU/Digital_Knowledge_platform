"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-surface-container border border-outline-variant">
            <span className="material-symbols-outlined text-2xl text-tertiary">person_add</span>
          </div>
          <h1 className="text-xl font-display font-bold text-on-surface">Create your account</h1>
          <p className="text-sm text-on-surface-variant mt-1">Join the Digital Knowledge Platform</p>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container p-5 shadow-[4px_4px_0_0_#27272a]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" required autoComplete="name" {...register("name")} error={errors.name?.message} />
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
              <div className="rounded-md border border-error/40 bg-error-container/20 px-3 py-2 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-primary text-on-primary border-primary hover:opacity-90 shadow-none"
              size="lg"
              loading={isSubmitting}
            >
              Create account
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center text-sm py-4 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-fixed transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
