"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import {
  User, Mail, Building2, Shield, LogOut, KeyRound,
  Activity, Download, CheckCircle2, ChevronDown, ChevronUp, Camera
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useBorrowingHistory, useMemberHolds, useMemberFines, useWishlist } from "@/features/library/hooks/useLibrary";
import toast from "react-hot-toast";


const AVATAR_COLORS = [
  { name: "Sleek Dark",     value: "#1a1a2e" },
  { name: "Deep Indigo",    value: "#312e81" },
  { name: "Emerald Forest", value: "#064e3b" },
  { name: "Royal Blue",     value: "#1e3a8a" },
  { name: "Warm Burgundy",  value: "#4c0519" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sessionTime, setSessionTime] = useState("");

  const { data: history, isLoading: histLoading } = useBorrowingHistory(user?.user_id ?? "");
  const { data: holds, isLoading: holdsLoading } = useMemberHolds(user?.user_id ?? "");
  const { data: fineData, isLoading: finesLoading } = useMemberFines(user?.user_id ?? "");
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();

  
  // Custom Bio states
  const [bio, setBio] = useState("Academic researcher and student author passionate about digital archives and machine learning.");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  

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
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Profile picture
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("#1a1a2e");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const savedPic = localStorage.getItem("user_profile_pic");
    if (savedPic) setProfilePic(savedPic);

    const savedColor = localStorage.getItem("user_avatar_color");
    if (savedColor) setAvatarColor(savedColor);

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

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfilePic(dataUrl);
      localStorage.setItem("user_profile_pic", dataUrl);
      toast.success("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePic = () => {
    setProfilePic(null);
    localStorage.removeItem("user_profile_pic");
    toast.success("Profile picture removed");
  };

  const handleAvatarColorChange = (colorVal: string) => {
    setAvatarColor(colorVal);
    localStorage.setItem("user_avatar_color", colorVal);
    window.dispatchEvent(new Event("avatar-theme-changed"));
    toast.success("Theme updated!");
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
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Title - GDPR Compliant
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("GDPR DATA SUBJECT ACCESS REQUEST", margin, yPosition);
      doc.setFontSize(12);
      doc.text("Personal Data Export Report", margin, yPosition + 8);

      yPosition += 20;

      // Export timestamp and request reference
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Request Date: ${new Date().toLocaleString()}`, margin, yPosition);
      doc.text(`Reference ID: DKP-${Date.now()}`, margin, yPosition + 5);
      yPosition += 15;

      // Helper function to add a section
      const addSection = (title: string, data: { label: string; value: string }[]) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.setTextColor(26, 26, 46);
        doc.text(title, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.setTextColor(0, 0, 0);

        data.forEach(({ label, value }) => {
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFont(undefined, "bold");
          doc.text(`${label}:`, margin, yPosition);
          doc.setFont(undefined, "normal");
          
          // Wrap long text
          const wrappedText = doc.splitTextToSize(value, contentWidth - 50);
          wrappedText.forEach((line: string, index: number) => {
            doc.text(line, margin + 50, yPosition + (index * lineHeight));
          });
          yPosition += Math.max(lineHeight, wrappedText.length * lineHeight) + 2;
        });

        yPosition += 5;
      };

      // 1. Data Subject Information
      addSection("1. DATA SUBJECT INFORMATION", [
        { label: "Full Name", value: user.name },
        { label: "Email Address", value: user.email },
        { label: "Account Status", value: "Active" },
      ]);

      // 2. Personal Identification Data
      addSection("2. PERSONAL IDENTIFICATION DATA", [
        { label: "Department/Organisation", value: user.department || "Not specified" },
        { label: "Access Role", value: user.role?.replace(/_/g, " ") || "Standard User" },
        { label: "User Profile Bio", value: bio || "Not provided" },
      ]);

      // 3. Data Processing Basis
      addSection("3. LEGAL BASIS FOR DATA PROCESSING", [
        { label: "Primary Basis", value: "Performance of Contract & User Consent" },
        { label: "Processing Purpose", value: "To provide academic platform services, manage user accounts, and maintain platform security" },
        { label: "Data Controller", value: "Digital Knowledge Platform Administration" },
      ]);

      // 4. Data Categories Stored
      addSection("4. CATEGORIES OF PERSONAL DATA PROCESSED", [
        { label: "Identification Data", value: "Name, email address, department" },
        { label: "Profile Data", value: "User biography, avatar preferences, security role" },
        { label: "Preference Data", value: "Notification settings, communication preferences" },
        { label: "Access Data", value: "Session information, activity logs, connection details" },
      ]);

      // 5. Data Retention
      addSection("5. DATA RETENTION PERIOD", [
        { label: "Retention Duration", value: "User account data retained for duration of active use plus 3 years" },
        { label: "Deletion Policy", value: "Upon account deletion, personal data is permanently removed within 30 days" },
        { label: "Backup Retention", value: "Backup copies retained for up to 90 days for recovery purposes" },
      ]);

      // 6. User Preferences & Settings
      const notificationData = [
        { label: "Due Date Reminders", value: notificationPrefs.dueDateReminders ? "Enabled" : "Disabled" },
        { label: "Hold Availability Notifications", value: notificationPrefs.holdAvailability ? "Enabled" : "Disabled" },
        { label: "Weekly Digest Emails", value: notificationPrefs.weeklyDigests ? "Enabled" : "Disabled" },
        { label: "In-App Notifications", value: notificationPrefs.appAlerts ? "Enabled" : "Disabled" },
      ];
      addSection("6. YOUR PRIVACY PREFERENCES", notificationData);

      // 7. Your GDPR Rights
      addSection("7. YOUR GDPR RIGHTS", [
        { label: "Right of Access", value: "You have the right to obtain confirmation and access to your personal data (this document)" },
        { label: "Right of Rectification", value: "You can request correction of inaccurate or incomplete personal data" },
        { label: "Right to Erasure", value: "You can request deletion of your personal data (right to be forgotten)" },
        { label: "Right to Restrict Processing", value: "You can request to limit how your data is used" },
        { label: "Right to Data Portability", value: "You can request your data in a structured, portable format" },
        { label: "Right to Object", value: "You can object to certain types of data processing" },
      ]);

      // 8. Contact & Support
      addSection("8. CONTACT INFORMATION", [
        { label: "Data Protection Officer", value: "dpo@digitalkowledgeplatform.edu" },
        { label: "Privacy Support", value: "privacy@digitalkowledgeplatform.edu" },
        { label: "General Inquiries", value: "support@digitalkowledgeplatform.edu" },
      ]);

      // Footer - GDPR Compliant
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This document is your GDPR Data Subject Access Request export. It contains all personal data processed by Digital Knowledge Platform",
        margin,
        pageHeight - 15
      );
      doc.text(
        "on your behalf. For questions about your data or to exercise your GDPR rights, contact our Data Protection Officer.",
        margin,
        pageHeight - 10
      );

      // Save the PDF
      const fileName = `GDPR_Data_Export_${user.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      toast.success("Your GDPR data export has been generated as PDF!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  if (!user) return null;

  const mockLogs = [
    { time: "Today, 2:40 PM", action: "Signed in to your account" },
    { time: "Yesterday, 11:15 AM", action: "Viewed book in library" },
    { time: "25 May, 4:30 PM", action: "Borrowed a book" },
    { time: "24 May, 9:12 AM", action: "Placed a hold request" },
    { time: "23 May, 1:05 PM", action: "Updated notification settings" },
  ];

  // ── helpers ──────────────────────────────────────────────────────────────────
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0,
        background: checked ? "var(--avatar-theme-color, #1a56db)" : "#d1d5db",
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 4, left: checked ? 22 : 4,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color="#6b7280" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 14, color: "#111827", margin: "2px 0 0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      </div>
    </div>
  );

  const SectionCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", ...style }}>
      {children}
    </div>
  );

  const SectionHead = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</p>
      {action}
    </div>
  );

  const activeLoans = (history ?? []).filter((h: any) => h.status !== "returned");
  const returnedLoans = (history ?? []).filter((h: any) => h.status === "returned");

  return (
    <AppLayout>
      <div style={{ padding: isMobile ? "20px 16px 48px" : "28px 32px 60px", maxWidth: 720, margin: "0 auto" }}>

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <SectionCard style={{ marginBottom: 16 }}>
          {/* Banner */}
          <div style={{ background: "var(--theme-gradient-135)", padding: isMobile ? "36px 20px 28px" : "48px 32px 32px", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 14, right: 16, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)" }}>
              ● Online
            </div>

            {/* Avatar with permanent camera badge */}
            <div style={{ position: "relative", display: "inline-block", margin: "0 auto 16px" }}>
              {/* Avatar circle */}
              <div style={{
                width: isMobile ? 90 : 104, height: isMobile ? 90 : 104,
                borderRadius: "50%", overflow: "hidden",
                background: "#fff",
                boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
                border: "3px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: isMobile ? 34 : 40, fontWeight: 800, color: "#111827", userSelect: "none" }}>
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Camera badge — always visible, bottom-right */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#fff", border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#374151",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                <Camera size={14} />
              </button>

              {/* Remove badge — only when photo is set */}
              {profilePic && (
                <button
                  onClick={handleRemoveProfilePic}
                  title="Remove photo"
                  style={{
                    position: "absolute", top: 2, right: 2,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#ef4444", border: "2px solid #fff",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
            />

            <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{user.name}</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "0 0 20px", textTransform: "capitalize" }}>{user.role?.replace(/_/g, " ")} · {user.department || "Digital Knowledge Platform"}</p>

            {/* Theme colour picker */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.04em" }}>THEME</span>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleAvatarColorChange(color.value)}
                  title={color.name}
                  style={{
                    width: avatarColor === color.value ? 22 : 18,
                    height: avatarColor === color.value ? 22 : 18,
                    borderRadius: "50%",
                    background: color.value,
                    border: avatarColor === color.value ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.25)",
                    cursor: "pointer", padding: 0,
                    transition: "all 0.15s",
                    boxShadow: avatarColor === color.value ? "0 0 0 2px rgba(255,255,255,0.4)" : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f3f4f6" }}>
            {[
              { label: "Borrowed", value: activeLoans.length },
              { label: "History", value: returnedLoans.length },
              { label: "Wishlist", value: (wishlist as any[])?.length ?? 0 },
            ].map(({ label, value }, i) => (
              <div key={label} style={{ padding: "14px 0", textAlign: "center", borderRight: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>{value}</p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0", fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── PERSONAL INFO ─────────────────────────────────────────────── */}
        <SectionCard style={{ marginBottom: 16 }}>
          <SectionHead title="Personal Info" />
          <div style={{ padding: "0 20px" }}>
            <InfoRow icon={User} label="Full Name" value={user.name} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Building2} label="Department" value={user.department || "Computer Science & Engineering"} />
            <InfoRow icon={Shield} label="Role" value={user.role?.replace(/_/g, " ") ?? "Member"} />
          </div>
        </SectionCard>

        {/* ── BIO ───────────────────────────────────────────────────────── */}
        <SectionCard style={{ marginBottom: 16 }}>
          <SectionHead
            title="About Me"
            action={
              <button
                onClick={() => { setIsEditingBio(!isEditingBio); setTempBio(bio); }}
                style={{ fontSize: 12, fontWeight: 600, color: "var(--avatar-theme-color, #1a56db)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {isEditingBio ? "Cancel" : "Edit"}
              </button>
            }
          />
          <div style={{ padding: "16px 20px" }}>
            {isEditingBio ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  value={tempBio}
                  onChange={e => setTempBio(e.target.value)}
                  maxLength={180}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", color: "#111827" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSaveBio} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--avatar-theme-color, #111827)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                {bio || "No bio yet. Click Edit to add one."}
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── LIBRARY STATUS (members only) ─────────────────────────────── */}
        {user?.role === "member" && (
          <SectionCard style={{ marginBottom: 16 }}>
            <SectionHead title="Library" />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Fines banner */}
              {!finesLoading && (fineData?.total_pending ?? 0) > 0 && (
                <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: 0 }}>Outstanding fine: BDT {fineData!.total_pending.toFixed(2)}</p>
                    <p style={{ fontSize: 11, color: "#92400e", margin: "2px 0 0" }}>Please visit the library to clear your fine.</p>
                  </div>
                </div>
              )}
              {!finesLoading && (fineData?.total_pending ?? 0) === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, margin: 0 }}>No outstanding fines</p>
                </div>
              )}

              {/* Active loans */}
              {!histLoading && activeLoans.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Currently Borrowed</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {activeLoans.slice(0, 3).map((loan: any) => {
                      const overdue = loan.status === "overdue" || new Date(loan.due_date) < new Date();
                      return (
                        <div key={loan.transaction_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 10 }}>{loan.title}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: overdue ? "#fee2e2" : "#dcfce7", color: overdue ? "#991b1b" : "#166534", flexShrink: 0 }}>
                            {overdue ? "Overdue" : "Active"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!histLoading && activeLoans.length === 0 && (
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No books currently borrowed.</p>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
        <SectionCard style={{ marginBottom: 16 }}>
          <SectionHead title="Notifications" />
          <div style={{ padding: "8px 20px" }}>
            {[
              { key: "dueDateReminders" as const, label: "Due date reminders", desc: "Get notified when books are almost due" },
              { key: "holdAvailability" as const, label: "Hold notifications", desc: "Alert when a reserved book is ready" },
              { key: "weeklyDigests" as const, label: "Weekly digest", desc: "Weekly summary email" },
              { key: "appAlerts" as const, label: "In-app alerts", desc: "Pop-up notifications in the portal" },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{desc}</p>
                </div>
                <Toggle checked={notificationPrefs[key]} onChange={() => handleTogglePref(key)} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── ACCOUNT & SECURITY ────────────────────────────────────────── */}
        <SectionCard style={{ marginBottom: 16 }}>
          <SectionHead title="Account & Security" />
          <div style={{ padding: "8px 20px" }}>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f3f4f6", textAlign: "left" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <KeyRound size={15} color="#2563eb" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Change Password</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Update your sign-in credentials</p>
              </div>
            </button>

            <button
              onClick={handleExportData}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f3f4f6", textAlign: "left" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Download size={15} color="#16a34a" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Download My Data</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Export your account data as PDF</p>
              </div>
            </button>

            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Activity size={15} color="#7c3aed" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Recent Activity</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>View your recent account actions</p>
                </div>
              </div>
              {showActivityLog ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
            </button>

            {showActivityLog && (
              <div style={{ paddingBottom: 12 }}>
                {mockLogs.map((log, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #f3f4f6", gap: 12 }}>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0, flex: 1 }}>{log.action}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, flexShrink: 0, fontFamily: "monospace" }}>{log.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── SIGN OUT ──────────────────────────────────────────────────── */}
        <button
          onClick={handleSignOut}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, border: "1px solid #fee2e2", background: "#fff", color: "#dc2626", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          <LogOut size={16} /> Sign Out
        </button>
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
    </AppLayout>
  );
}
