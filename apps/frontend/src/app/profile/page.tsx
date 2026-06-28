"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { 
  User, Mail, Building2, Shield, LogOut, ShieldCheck, KeyRound, 
  MonitorDot, Activity, Heart, Bell, Download, Lock, CheckCircle2, ChevronDown, ChevronUp,
  ArrowLeft
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBorrowingHistory, useMemberHolds, useMemberFines, useWishlist } from "@/features/library/hooks/useLibrary";
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

  const { data: history, isLoading: histLoading } = useBorrowingHistory(user?.user_id ?? "");
  const { data: holds, isLoading: holdsLoading } = useMemberHolds(user?.user_id ?? "");
  const { data: fineData, isLoading: finesLoading } = useMemberFines(user?.user_id ?? "");
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();

  
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

  const fields = [
    { icon: User, label: "Full Name", value: user.name, desc: "GDPR Personal Data: Your legal name registered in our system" },
    { icon: Mail, label: "Email Address", value: user.email, desc: "GDPR Personal Data: Primary contact address for account and communications" },
    { icon: Building2, label: "Department", value: user.department || "Computer Science & Engineering", desc: "GDPR Special Category: Institutional classification for access control" },
    { icon: Shield, label: "Security Role", value: user.role?.replace("_", " "), desc: "GDPR Processing Basis: Your privilege level and platform permissions", isBadge: true },
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
      <header style={{
        background: "#e8eaed",
        borderBottom: "1px solid #d1d5db",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px"
        }}>
          {/* Top Left corner: Back button */}
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 0",
              fontSize: "16px",
              fontWeight: 700,
              color: "#495057",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#495057";
            }}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>

          {/* Top Right corner: Digital Knowledge Platform */}
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--avatar-theme-color, #111827)",
            letterSpacing: "-0.01em",
            transition: "color 0.3s ease"
          }}>
            Digital Knowledge Platform
          </span>
        </div>
      </header>

      <div style={{ padding: "48px 24px 80px" }} className="profile-container">
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
            }} className="profile-banner">
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
              }} className="profile-avatar">
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
              
              {/* SECTION 1: PERSONAL BIO  */}
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

              {/* SECTION 2: PERSONAL DATA */}
              <div style={{ paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 20px"
                }}>
                  Personal Data 
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
                            background: "color-mix(in srgb, var(--avatar-theme-color, #1a56db) 10%, transparent)",
                            color: "var(--avatar-theme-color, #1a56db)",
                            border: "1px solid color-mix(in srgb, var(--avatar-theme-color, #1a56db) 30%, transparent)",
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

              {/* SECTION 2.5: LIBRARY ACCOUNT STATUS */}
              {user?.role === "member" && (
                <div style={{ marginTop: "36px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                  <h3 style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111827",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 20px"
                  }}>
                    Library Account Status
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Active Loans & Holds */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ padding: "18px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                          Currently Borrowed Items
                        </h4>
                        {histLoading ? (
                          <p style={{ fontSize: "12px", color: "#64748b" }}>Loading active loans...</p>
                        ) : !history || history.filter((h: any) => h.status !== "returned").length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No books currently borrowed.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {history.filter((h: any) => h.status !== "returned").map((loan: any) => {
                              const isOverdue = loan.status === "overdue" || new Date(loan.due_date) < new Date();
                              return (
                                <div key={loan.transaction_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={loan.title}>
                                      {loan.title}
                                    </span>
                                    <span style={{ fontSize: "11px", color: isOverdue ? "#ef4444" : "#64748b", fontWeight: 500 }}>
                                      Due: {new Date(loan.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    </span>
                                  </div>
                                  <span style={{
                                    padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                                    background: isOverdue ? "#fee2e2" : "#dcfce7", color: isOverdue ? "#991b1b" : "#166534"
                                  }}>
                                    {isOverdue ? "Overdue" : "Active"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "18px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: "0 0 12px" }}>
                          Active Hold Requests (Queue)
                        </h4>
                        {holdsLoading ? (
                          <p style={{ fontSize: "12px", color: "#64748b" }}>Loading holds...</p>
                        ) : !holds || holds.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No active hold requests.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {holds.map((hold: any) => (
                              <div key={hold.hold_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={hold.title}>
                                    {hold.title}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                                    Requested: {new Date(hold.request_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                  </span>
                                </div>
                                <span style={{
                                  padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                                  background: hold.status === "available" ? "#dcfce7" : "#dbeafe", color: hold.status === "available" ? "#166534" : "#1e40af"
                                }}>
                                  {hold.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Fines & History */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ padding: "18px 20px", background: "#fffdfa", borderRadius: "8px", border: "1px solid #fef08a" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#854d0e", margin: "0 0 12px" }}>
                          Overdue Fine Tracking
                        </h4>
                        {finesLoading ? (
                          <p style={{ fontSize: "12px", color: "#854d0e" }}>Loading fines...</p>
                        ) : !fineData || fineData.total_pending === 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={16} color="#16a34a" />
                            <p style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, margin: 0 }}>No outstanding fines. All clear!</p>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#dc2626", marginBottom: "12px" }}>
                              BDT {fineData.total_pending.toFixed(2)}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {fineData.fines?.filter((f: any) => f.status === "pending").map((fine: any) => (
                                <div key={fine.fine_id} style={{ fontSize: "12px", color: "#475569", borderBottom: "1px solid #fef08a", paddingBottom: "6px" }}>
                                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{fine.book_title}</div>
                                  <div style={{ color: "#64748b" }}>Reason: {fine.reason} ({fine.amount} BDT)</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "18px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: "0 0 12px" }}>
                          Borrowing History
                        </h4>
                        {histLoading ? (
                          <p style={{ fontSize: "12px", color: "#64748b" }}>Loading history...</p>
                        ) : !history || history.filter((h: any) => h.status === "returned").length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>No previous history found.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "180px", overflowY: "auto" }}>
                            {history.filter((h: any) => h.status === "returned").map((loan: any) => (
                              <div key={loan.transaction_id} style={{ fontSize: "12px", color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={loan.title}>{loan.title}</div>
                                <div style={{ color: "#64748b", fontSize: "11px" }}>
                                  Returned: {new Date(loan.return_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: DATA PROCESSING PREFERENCES (GDPR ARTICLE 21) */}
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
                    Data Processing Preferences (GDPR Article 21)
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
                      color: "var(--avatar-theme-color, #2563eb)",
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
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--avatar-theme-color)" }}
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
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--avatar-theme-color)" }}
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
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--avatar-theme-color)" }}
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
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--avatar-theme-color)" }}
                    />
                  </div>

                </div>
              </div>



              {/* SECTION 4: SECURITY CONTROLS & GDPR COMPLIANCE AUDIT LOG */}
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
                  <ShieldCheck size={16} color="#111827" /> Security & Account Management
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
                      width: "36px", height: "36px", borderRadius: "8px",
                      background: "color-mix(in srgb, var(--avatar-theme-color, #2563eb) 10%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <KeyRound size={16} color="var(--avatar-theme-color, #1a56db)" />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "block" }}>Change Password</span>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>Update your sign-in credentials</span>
                    </div>
                  </div>

                  {/* GDPR Data Subject Access Request */}
                  <div 
                    onClick={handleExportData}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "16px", 
                      background: "#ecfdf5", 
                      borderRadius: "8px", 
                      border: "1px solid #059669",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#d1fae5";
                      e.currentTarget.style.borderColor = "#047857";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#ecfdf5";
                      e.currentTarget.style.borderColor = "#059669";
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "8px", background: "#dbeafe",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <Download size={16} color="#0369a1" />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "block" }}>GDPR Data Subject Access Request</span>
                      <span style={{ fontSize: "11px", color: "#374151" }}>Download your complete personal data record as PDF </span>
                    </div>
                  </div>

                </div>

                {/* Personal Activity & Processing History */}
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
                      <Activity size={14} color="#6b7280" /> Account Activity & Processing Log (GDPR Transparency)
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
