"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/profile");
  }, [isAuthenticated, router]);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const fields = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Building2, label: "Department", value: user.department || "Not specified" },
    { icon: Shield, label: "Role", value: user.role?.replace("_", " ") },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Profile"
          description="Manage your account information"
        />

        {/* Profile Card */}
        <Card>
          {/* Header Banner */}
          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d3d 100%)", padding: "48px 32px", textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#fff",
              margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              <User size={40} color="#1a1a2e" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{user.name}</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>{user.email}</p>
          </div>

          {/* Profile Fields */}
          <div style={{ padding: "40px 32px" }}>
            {/* Fields Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="space-y-2">
                  <label className="form-label flex items-center gap-1.5">
                    <Icon size={14} /> {label}
                  </label>
                  <div style={{
                    padding: "12px 14px",
                    background: "var(--color-canvas-subtle)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border-default)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--color-fg-default)"
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, paddingTop: 24, borderTop: "1px solid var(--color-border-muted)" }}>
              <Button
                variant="primary"
                icon={<LogOut size={14} />}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
