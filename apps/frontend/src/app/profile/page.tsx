"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
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
    { icon: Shield,    label: "Role",       value: user.role },
  ];

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
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/profile" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, color: "#ffffff", background: "#111827", borderRadius: "6px", textDecoration: "none" }}>
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "48px 32px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          {/* Profile Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Profile
            </h1>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>Manage your account information and settings</p>
          </div>

          {/* Profile Card */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            
            {/* Header Section */}
            <div style={{ background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)", padding: "32px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#ffffff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={40} style={{ color: "#000000" }} />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", margin: "0 0 6px" }}>{user.name}</h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>{user.email}</p>
            </div>

            {/* Profile Information */}
            <div style={{ padding: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                {fields.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#6b7280", marginBottom: "8px" }}>
                      <Icon size={16} style={{ color: "#111827" }} />
                      {label}
                    </label>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0, padding: "10px 12px", background: "#f3f4f6", borderRadius: "6px" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: "#e9ebee", borderTop: "1px solid #d1d5db", marginTop: "48px" }}>
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

    </div>
  );
}
