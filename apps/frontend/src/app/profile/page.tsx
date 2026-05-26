"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield, LogOut, ShieldCheck, KeyRound, MonitorDot, Activity, Heart, Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sessionTime, setSessionTime] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/profile");
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Generate a premium session timestamp
    const now = new Date();
    setSessionTime(now.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
  }, []);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const fields = [
    { icon: User, label: "Full Name", value: user.name, desc: "Primary display name across the platform" },
    { icon: Mail, label: "Email Address", value: user.email, desc: "Used for system log-in and notifications" },
    { icon: Building2, label: "Department", value: user.department || "Not specified", desc: "Assigned academic or structural division" },
    { icon: Shield, label: "Security Role", value: user.role?.replace("_", " "), desc: "Privilege level controlling platform access", isBadge: true },
  ];

  return (
    <>
      {/* ── top navigation with header back button ── */}
      <Navbar showBack={true} />

      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#eef0f3",
        minHeight: "calc(100vh - 56px)",
        padding: "48px 24px 80px",
        color: "#111827"
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          
          {/* ── UNIFIED SINGLE PROFILE BOX (WHITE CARD LIKE SIGN IN BOX) ── */}
          <Card style={{
            overflow: "hidden",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)"
          }} padding="none">
            
            {/* Visual Header Banner (Dark accent contrast inside white card) */}
            <div style={{
              background: "linear-gradient(135deg, #09090b 0%, #1c1d21 100%)",
              padding: "56px 32px",
              position: "relative",
              overflow: "hidden",
              textAlign: "center",
              borderBottom: "1px solid #e5e7eb"
            }}>
              {/* Active Session indicator inside banner */}
              <div style={{
                position: "absolute",
                top: "20px",
                right: "24px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#ffffff",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "4px 12px",
                borderRadius: "100px",
                border: "1px solid rgba(255, 255, 255, 0.12)"
              }}>
                Active Session
              </div>

              {/* Avatar circle */}
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: "#ffffff",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                border: "3px solid rgba(255,255,255,0.15)",
                position: "relative",
                zIndex: 1
              }}>
                <User size={44} color="#0c0d0f" />
              </div>
              
              <h2 style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#ffffff",
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
                position: "relative",
                zIndex: 1
              }}>
                {user.name}
              </h2>
              <p style={{
                fontSize: "14px",
                color: "#a1a1aa",
                margin: 0,
                fontWeight: 500,
                position: "relative",
                zIndex: 1
              }}>
                {user.email}
              </p>
            </div>

            {/* Profile Box Main Body */}
            <div style={{ padding: "40px 32px", background: "#ffffff" }}>
              
              {/* SECTION 1: ACCOUNT CREDENTIALS */}
              <div>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 20px"
                }}>
                  Account Credentials
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  {fields.map(({ icon: Icon, label, value, desc, isBadge }) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon size={14} color="#71717a" /> {label}
                      </label>
                      {isBadge ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            padding: "6px 14px",
                            background: "#f3f4f6",
                            color: "#1f2937",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            textTransform: "capitalize"
                          }}>
                            {value}
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          padding: "12px 14px",
                          background: "#f9fafb",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#111827"
                        }}>
                          {value}
                        </div>
                      )}
                      <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: SECURITY & PRIVACY */}
              <div style={{ marginTop: "36px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <ShieldCheck size={16} color="#111827" /> Security & Privacy
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <KeyRound size={16} color="#4b5563" />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Secured</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>SSL Encrypted Connection</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <MonitorDot size={16} color="#4b5563" />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Session</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Active since {sessionTime || "Today"}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <Activity size={16} color="#4b5563" />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Auditing</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Events logged securely</span>
                  </div>

                </div>
              </div>

              {/* SECTION 3: GLOBAL PREFERENCES */}
              <div style={{ marginTop: "36px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 20px"
                }}>
                  Global Preferences
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bell size={14} color="#4b5563" /> System Notifications
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#1f2937",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      padding: "3px 10px",
                      borderRadius: "6px"
                    }}>
                      Enabled
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Heart size={14} color="#4b5563" /> Wishlist Updates
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#1f2937",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      padding: "3px 10px",
                      borderRadius: "6px"
                    }}>
                      Instant
                    </span>
                  </div>

                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div style={{
                display: "flex",
                gap: "14px",
                marginTop: "48px",
                paddingTop: "32px",
                borderTop: "1px solid #e5e7eb",
                justifyContent: "flex-end"
              }}>
                <Button
                  onClick={() => router.push("/dashboard")}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "#1f2937",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Return to Dashboard
                </Button>
                <Button
                  onClick={handleSignOut}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "#ffffff",
                    color: "#1f2937",
                    border: "1px solid #d1d5db",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
                >
                  <LogOut size={14} />
                  Sign Out Account
                </Button>
              </div>

            </div>
          </Card>

        </div>
      </div>
    </>
  );
}
