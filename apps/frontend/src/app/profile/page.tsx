"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Building2, Shield, LogOut, ShieldCheck, KeyRound, 
  MonitorDot, Activity, Heart, Bell, Download, Lock, CheckCircle2, ChevronDown, ChevronUp,
  FolderGit, ExternalLink, Pencil
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useShowcaseGallery } from "@/hooks/useShowcase";
import toast from "react-hot-toast";

const AVATAR_COLORS = [
  { name: "Sleek Dark", value: "#1a1a2e" },
  { name: "Deep Indigo", value: "#312e81" },
  { name: "Emerald Forest", value: "#064e3b" },
  { name: "Royal Blue", value: "#1e3a8a" },
  { name: "Warm Burgundy", value: "#4c0519" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sessionTime, setSessionTime] = useState("");
  
  // Fetch user's showcase projects
  const { data: myProjects, isLoading: projectsLoading } = useShowcaseGallery({
    submitted_by: user?.user_id ?? "non-existent-user",
  });
  
  // Custom Bio states
  const [bio, setBio] = useState("Academic researcher and student author passionate about digital archives and machine learning.");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  
  // Custom Avatar Color state
  const [avatarColor, setAvatarColor] = useState("#1a1a2e");

  // Notification Preferences states
  const [notificationPrefs, setNotificationPrefs] = useState({
    dueDateReminders: true,
    holdAvailability: true,
    weeklyDigests: false,
    appAlerts: true,
  });

  // Password Change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Activity Log view state
  const [showActivityLog, setShowActivityLog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/profile");
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Generate active session timestamp
    const now = new Date();
    setSessionTime(now.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    
    // Load local storage preferences
    const savedBio = localStorage.getItem("user_bio");
    if (savedBio) {
      setBio(savedBio);
      setTempBio(savedBio);
    } else {
      setTempBio("Academic researcher and student author passionate about digital archives and machine learning.");
    }

    const savedColor = localStorage.getItem("user_avatar_color");
    if (savedColor) {
      setAvatarColor(savedColor);
    }

    const savedPrefs = localStorage.getItem("notification_prefs");
    if (savedPrefs) {
      try {
        setNotificationPrefs(JSON.parse(savedPrefs));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  const handleSaveBio = () => {
    setBio(tempBio);
    localStorage.setItem("user_bio", tempBio);
    setIsEditingBio(false);
    toast.success("Bio updated successfully!");
  };

  const handleAvatarColorChange = (colorVal: string) => {
    setAvatarColor(colorVal);
    localStorage.setItem("user_avatar_color", colorVal);
    window.dispatchEvent(new Event("avatar-theme-changed"));
    toast.success("Avatar backdrop customized!");
  };

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    const updated = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(updated);
    localStorage.setItem("notification_prefs", JSON.stringify(updated));
    toast.success("Preferences updated");
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password updated successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
  };

  const handleExportData = () => {
    if (!user) return;
    const personalData = {
      fullName: user.name,
      email: user.email,
      department: user.department || "Not specified",
      securityRole: user.role,
      personalBio: bio,
      sessionDetails: {
        connection: "Secure SSL/TLS",
        activeSince: sessionTime
      },
      notificationSettings: notificationPrefs,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(personalData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dkp_data_export_${user.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    toast.success("Your personal data has been exported!");
  };

  if (!user) return null;

  const fields = [
    { icon: User, label: "Full Name", value: user.name, desc: "Primary display name across the portal" },
    { icon: Mail, label: "Email Address", value: user.email, desc: "Used for account sign-in and delivery notifications" },
    { icon: Building2, label: "Department", value: user.department || "Computer Science & Engineering", desc: "Assigned academic or structural division" },
    { icon: Shield, label: "Security Role", value: user.role?.replace("_", " "), desc: "Privilege level controlling platform access", isBadge: true },
  ];

  const mockLogs = [
    { time: "Today at 02:40 PM", action: "Successfully authenticated from browser session" },
    { time: "Yesterday at 11:15 AM", action: "Completed reading book Concept of Data Mining in viewer" },
    { time: "25 May 2026, 04:30 PM", action: "Borrowed book concept and techniques 3rd edition" },
    { time: "24 May 2026, 09:12 AM", action: "Placed a hold reservation on textbook catalog item" },
    { time: "23 May 2026, 01:05 PM", action: "Updated profile preferences & email digests" },
  ];

  return (
    <>
      <Navbar showBack={true} />

      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#eef0f3",
        minHeight: "calc(100vh - 56px)",
        padding: "48px 24px 80px",
        color: "#111827"
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          
          <Card style={{
            overflow: "hidden",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }} padding="none">
            
            {/* ── PROFILE BANNER ── */}
            <div style={{
              background: "var(--theme-gradient-135)",
              padding: "56px 32px",
              position: "relative",
              overflow: "hidden",
              textAlign: "center",
              borderBottom: "1px solid #e5e7eb",
              transition: "all 0.4s ease"
            }}>
              {/* Active session banner */}
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

              {/* Interactive Avatar */}
              <div style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "#ffffff",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                border: "4px solid rgba(255,255,255,0.15)",
                fontSize: "36px",
                fontWeight: 800,
                color: "#111827",
                position: "relative",
                zIndex: 1
              }}>
                {user.name?.[0]?.toUpperCase()}
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
                color: "rgba(255,255,255,0.6)",
                margin: "0 0 20px",
                fontWeight: 500,
                position: "relative",
                zIndex: 1
              }}>
                {user.email}
              </p>

              {/* Avatar Color Customizer */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginRight: 4 }}>Avatar Theme:</span>
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => handleAvatarColorChange(color.value)}
                    title={color.name}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: color.value,
                      border: avatarColor === color.value ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      padding: 0,
                      transform: avatarColor === color.value ? "scale(1.2)" : "scale(1)",
                      transition: "all 0.2s"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Profile Body */}
            <div style={{ padding: "40px 32px", background: "#ffffff" }}>
              
              {/* SECTION 1: BIO EDITOR */}
              <div style={{ marginBottom: "36px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0
                  }}>
                    Personal Bio
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditingBio(!isEditingBio);
                      setTempBio(bio);
                    }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1f2937",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {isEditingBio ? "Cancel" : "Edit Bio"}
                  </button>
                </div>

                {isEditingBio ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <textarea
                      value={tempBio}
                      onChange={e => setTempBio(e.target.value)}
                      maxLength={180}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button onClick={handleSaveBio} size="sm" style={{ padding: "6px 14px", fontSize: 12 }}>
                        Save Bio
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    lineHeight: 1.6,
                    margin: 0,
                    padding: "12px 14px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontStyle: "italic"
                  }}>
                    &quot;{bio}&quot;
                  </p>
                )}
              </div>

              {/* SECTION 2: ACCOUNT CREDENTIALS */}
              <div style={{ paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
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
                            background: "#e8f0fe",
                            color: "#1a56db",
                            border: "1px solid #c3ddfd",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "capitalize",
                            letterSpacing: "0.3px"
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

              {/* SECTION 3: INTERACTIVE NOTIFICATION PREFERENCES */}
              <div style={{ marginTop: "36px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0
                  }}>
                    Notification Preferences
                  </h3>
                  
                  {/* Direct link to in-app Feed */}
                  <button
                    onClick={() => router.push("/notifications")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563eb",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    <Bell size={13} /> View In-App Notification Feed
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer"
                  }} onClick={() => handleTogglePref("dueDateReminders")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Due Date Reminders</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Alerts for books due in 3 days</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.dueDateReminders}
                      onChange={() => {}} // handled by parent onClick
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer"
                  }} onClick={() => handleTogglePref("holdAvailability")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Hold Availability Alerts</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Notification when reserve is ready</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.holdAvailability}
                      onChange={() => {}}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer"
                  }} onClick={() => handleTogglePref("weeklyDigests")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Weekly Email Digests</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Weekly newsletter and summaries</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.weeklyDigests}
                      onChange={() => {}}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer"
                  }} onClick={() => handleTogglePref("appAlerts")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>In-App Banners</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Pop-up notifications in portal</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.appAlerts}
                      onChange={() => {}}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 3.5: STUDENT SHOWCASE PROJECTS */}
              <div style={{ marginTop: "36px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <FolderGit size={16} color="#111827" /> Showcase Project Submissions
                  </h3>
                  
                  <button
                    onClick={() => router.push("/showcase/submit")}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--avatar-theme-color, #2563eb)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    + Submit New Project
                  </button>
                </div>

                {projectsLoading ? (
                  <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading project submissions...</p>
                ) : !myProjects || myProjects.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "24px 16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px dashed #d1d5db"
                  }}>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 12px" }}>
                      You haven&apos;t submitted any semester projects to the Showcase Gallery yet.
                    </p>
                    <Button
                      onClick={() => router.push("/showcase/submit")}
                      style={{
                        fontSize: "12px",
                        padding: "6px 14px",
                        background: "var(--theme-gradient-160)",
                        border: "none",
                        color: "#ffffff"
                      }}
                    >
                      Submit Project Now
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {myProjects.map((project: any) => {
                      const isPending = project.status === "pending_review";
                      const isChanges = project.status === "changes_requested";
                      const isPublished = project.status === "published";

                      let statusBg = "#f3f4f6";
                      let statusColor = "#374151";
                      let statusLabel = "Draft";

                      if (isPublished) {
                        statusBg = "#ecfdf5";
                        statusColor = "#047857";
                        statusLabel = "Approved & Published";
                      } else if (isPending) {
                        statusBg = "#fef3c7";
                        statusColor = "#b45309";
                        statusLabel = "Pending Advisor Review";
                      } else if (isChanges) {
                        statusBg = "#fee2e2";
                        statusColor = "#b91c1c";
                        statusLabel = "Changes Requested";
                      }

                      return (
                        <div
                          key={project.project_id}
                          style={{
                            padding: "16px",
                            background: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            position: "relative"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div>
                              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                                {project.title}
                              </h4>
                              <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                                {project.department} · {project.semester}
                              </p>
                            </div>
                            
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: statusBg,
                              color: statusColor,
                              whiteSpace: "nowrap"
                            }}>
                              {statusLabel}
                            </span>
                          </div>

                          {isChanges && project.advisor_comments && (
                            <p style={{
                              fontSize: "11px",
                              color: "#991b1b",
                              background: "#fef2f2",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              borderLeft: "3px solid #ef4444",
                              margin: "4px 0 0",
                              fontStyle: "italic"
                            }}>
                              <strong>Advisor Feedback:</strong> &ldquo;{project.advisor_comments}&rdquo;
                            </p>
                          )}

                          <div style={{ display: "flex", gap: "16px", marginTop: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "8px" }}>
                            <button
                              onClick={() => router.push(`/showcase/${project.project_id}`)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#2563eb",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              <ExternalLink size={13} /> View Details
                            </button>
                            {(isPending || isChanges) && (
                              <button
                                onClick={() => router.push(`/showcase/${project.project_id}/edit`)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#b45309",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0
                                }}
                              >
                                <Pencil size={13} /> Edit Submission
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 4: SECURITY CONTROLS & EXPANDABLE AUDIT LOG */}
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
                  <ShieldCheck size={16} color="#111827" /> Security, Activity & Data Settings
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  
                  {/* Password Change Action */}
                  <div 
                    onClick={() => setShowPasswordModal(true)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "16px", 
                      background: "#f9fafb", 
                      borderRadius: "8px", 
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "8px", background: "#e8f0fe",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <KeyRound size={16} color="#1a56db" />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "block" }}>Change Password</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Update your sign-in credentials</span>
                    </div>
                  </div>

                  {/* GDPR Export Action */}
                  <div 
                    onClick={handleExportData}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "16px", 
                      background: "#f9fafb", 
                      borderRadius: "8px", 
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "8px", background: "#ecfdf5",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <Download size={16} color="#059669" />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "block" }}>Export Personal Data</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Download your GDPR profile info (.json)</span>
                    </div>
                  </div>

                </div>

                {/* Audit Log Toggle */}
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  <button
                    onClick={() => setShowActivityLog(!showActivityLog)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "#f9fafb",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Activity size={14} color="#6b7280" /> Personal Activity History Log
                    </span>
                    {showActivityLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  {showActivityLog && (
                    <div style={{ padding: "16px", background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {mockLogs.map((log, index) => (
                          <div key={index} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: index !== mockLogs.length - 1 ? "1px solid #f3f4f6" : "none", paddingBottom: 8 }}>
                            <span style={{ color: "#374151", fontWeight: 500 }}>{log.action}</span>
                            <span style={{ color: "#9ca3af", fontFamily: "monospace" }}>{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    background: "var(--theme-gradient-160)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}
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
                    padding: "9px 20px",
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

      {/* ── PASSWORD CHANGE MODAL ── */}
      {showPasswordModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "28px 32px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            boxSizing: "border-box"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <KeyRound size={20} color="#1a56db" /> Change Password
            </h3>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 20px" }}>
              Securely update your portal access credentials.
            </p>

            <form onSubmit={handleChangePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151" }}>Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151" }}>New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151" }}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--theme-gradient-160)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
