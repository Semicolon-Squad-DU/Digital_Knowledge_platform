"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-surface-container border border-outline-variant">
            <span className="material-symbols-outlined text-2xl text-primary">lock_open</span>
          </div>
          <h1 className="text-xl font-display font-bold text-on-surface">Sign in to DKP</h1>
          <p className="text-sm text-on-surface-variant mt-1">University Digital Knowledge Platform</p>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container p-5 shadow-[4px_4px_0_0_#27272a]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
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
              Sign in
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center text-sm py-4 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant">
          New to DKP?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-primary-fixed transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
