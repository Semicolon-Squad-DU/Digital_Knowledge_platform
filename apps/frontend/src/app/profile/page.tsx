"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";

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
    { icon: User,      label: "Full Name",  value: user.name },
    { icon: Mail,      label: "Email",      value: user.email },
    { icon: Building2, label: "Department", value: user.department || "Not specified" },
    { icon: Shield,    label: "Role",       value: user.role?.replace("_", " ") },
  ];

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: 680 }}>
        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
            Profile
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Manage your account information
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {/* Header banner */}
          <div style={{ background: "#1a1a2e", padding: "32px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#fff",
              margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={36} color="#1a1a2e" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{user.name}</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>{user.email}</p>
          </div>

          {/* Fields */}
          <div style={{ padding: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.09em", color: "#6b7280", marginBottom: 6,
                  }}>
                    <Icon size={14} color="#111827" /> {label}
                  </label>
                  <p style={{
                    fontSize: 14, fontWeight: 500, color: "#111827", margin: 0,
                    padding: "10px 12px", background: "#f3f4f6", borderRadius: 6,
                    textTransform: label === "Role" ? "capitalize" : "none",
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: "#111827", color: "#fff", border: "none", cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
