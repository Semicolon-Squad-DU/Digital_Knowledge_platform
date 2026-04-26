"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!user) return null;

  const fields = [
    { icon: User,      label: "Name",       value: user.name },
    { icon: Mail,      label: "Email",      value: user.email },
    { icon: Building2, label: "Department", value: user.department || "Not specified" },
    { icon: Shield,    label: "Role",       value: user.role },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Profile</h1>

      <div
        className="rounded-md border divide-y"
        style={{
          background: "var(--color-canvas-default)",
          borderColor: "var(--color-border-default)",
        }}
      >
        {fields.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderColor: "var(--color-border-muted)" }}
          >
            <Icon size={16} style={{ color: "var(--color-fg-muted)", flexShrink: 0 }} />
            <div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>{label}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-fg-default)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
