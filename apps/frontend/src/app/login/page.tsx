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
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Dynamically import Player to avoid SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((m) => m.Player),
  { ssr: false }
);

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");
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
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Invalid email or password");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "linear-gradient(to right, #A8D5A8 0%, #A8D5A8 50%, #ffffff 50%, #ffffff 100%)", padding: "0", margin: "0", overflow: "hidden" }}
    >
      <div className="w-full flex items-center justify-between gap-8" style={{ maxWidth: "1200px", height: "100%", paddingX: "1rem", paddingY: "3rem" }}>
        {/* Left — Form */}
        <div style={{ flex: "0 0 auto", width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ background: "var(--color-canvas-default)", border: "1px solid var(--color-border-default)" }}
            >
              <BookOpen size={22} style={{ color: "var(--color-fg-default)" }} />
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--color-fg-default)" }}>
              Sign in to DKP
            </h1>
          </div>

          {/* Form card */}
          <div
            className="rounded-md border p-5"
            style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)" }}
          >
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
                Sign in
              </Button>
            </form>
          </div>

          {/* Register link */}
          <div
            className="mt-3 text-center text-sm py-4 rounded-md border"
            style={{ background: "var(--color-canvas-default)", borderColor: "var(--color-border-default)", color: "var(--color-fg-muted)" }}
          >
            New to DKP?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#1a7f5a" }}>
              Create an account
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
