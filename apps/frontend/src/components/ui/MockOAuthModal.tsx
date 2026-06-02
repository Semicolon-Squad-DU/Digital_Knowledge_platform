"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { ShieldCheck, User, PlusCircle, Check } from "lucide-react";

interface MockOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "google" | "sso";
  onAuthorize: (data: {
    email: string;
    name: string;
    role: string;
    provider: "google" | "sso";
    providerId: string;
    department?: string;
  }) => void;
}

const GOOGLE_ACCOUNTS = [
  { name: "John Doe", email: "john.doe@gmail.com", role: "member", dept: "English" },
  { name: "Prof. Julian Archer", email: "j.archer@institution.edu", role: "researcher", dept: "Computer Science & Engineering" },
  { name: "Alice Student", email: "alice.s@university.edu", role: "student_author", dept: "Electrical & Electronic Engineering" },
  { name: "Librarian Jenkins", email: "jenkins@dkp.edu.bd", role: "librarian", dept: "Library Sciences" },
  { name: "System Administrator", email: "admin@dkp.edu.bd", role: "admin", dept: "Information Technology" },
];

const INSTITUTIONS = [
  "University of Dhaka",
  "BUET",
  "MIT",
  "Oxford University",
  "Stanford University",
];

const ROLES = [
  { value: "member", label: "Member" },
  { value: "student_author", label: "Student Author" },
  { value: "researcher", label: "Researcher" },
  { value: "archivist", label: "Archivist" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

export function MockOAuthModal({ isOpen, onClose, provider, onAuthorize }: MockOAuthModalProps) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(0);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("member");
  const [customDept, setCustomDept] = useState("Computer Science & Engineering");
  const [selectedInstitution, setSelectedInstitution] = useState(INSTITUTIONS[0]);

  const handleAuthorize = () => {
    if (provider === "google") {
      if (selectedPresetIndex !== null) {
        const preset = GOOGLE_ACCOUNTS[selectedPresetIndex];
        onAuthorize({
          email: preset.email,
          name: preset.name,
          role: preset.role,
          provider: "google",
          providerId: `google_${preset.email}`,
          department: preset.dept,
        });
      } else {
        if (!customEmail || !customName) return;
        onAuthorize({
          email: customEmail,
          name: customName,
          role: customRole,
          provider: "google",
          providerId: `google_custom_${Date.now()}`,
          department: customDept,
        });
      }
    } else {
      if (!customEmail || !customName) return;
      onAuthorize({
        email: customEmail,
        name: customName,
        role: customRole,
        provider: "sso",
        providerId: `sso_${selectedInstitution}_${Date.now()}`,
        department: customDept,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={provider === "google" ? "Google Account Authorization (Mock)" : "Institutional SSO Authorization (Mock)"}
      description={provider === "google" ? "Sign in using a mock Google account credentials" : "Select your university and sign in"}
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {provider === "google" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-fg-muted)" }}>
              Choose Google Account
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {GOOGLE_ACCOUNTS.map((account, index) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => setSelectedPresetIndex(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    border: `1px solid ${selectedPresetIndex === index ? "var(--color-accent-emphasis, #1f6feb)" : "var(--color-border-default)"}`,
                    background: selectedPresetIndex === index ? "var(--color-accent-subtle, rgba(56,139,253,0.1))" : "var(--color-canvas-default)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(17, 24, 39, 0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--color-fg-default)"
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-fg-default)" }}>{account.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--color-fg-muted)" }}>{account.email} · <span style={{ textTransform: "capitalize" }}>{account.role}</span></p>
                    </div>
                  </div>
                  {selectedPresetIndex === index && <Check size={16} color="var(--color-accent-fg, #0969da)" />}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedPresetIndex(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px",
                  border: `1px solid ${selectedPresetIndex === null ? "var(--color-accent-emphasis, #1f6feb)" : "var(--color-border-default)"}`,
                  background: selectedPresetIndex === null ? "var(--color-accent-subtle, rgba(56,139,253,0.1))" : "var(--color-canvas-default)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  outline: "none",
                  gap: "10px"
                }}
              >
                <PlusCircle size={20} color="var(--color-fg-muted)" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-fg-default)" }}>Use custom mock credentials</span>
              </button>
            </div>
          </div>
        )}

        {provider === "sso" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Select Institution</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="form-select w-full"
              style={{ padding: "8px", fontSize: "13px", borderRadius: "6px", border: "1px solid var(--color-border-default)" }}
            >
              {INSTITUTIONS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        )}

        {(provider === "sso" || selectedPresetIndex === null) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--color-border-default)", padding: "12px", borderRadius: "6px", background: "var(--color-canvas-subtle)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Julian Archer"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--color-border-default)", borderRadius: "6px", background: "var(--color-canvas-default)" }}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. user@institution.edu"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--color-border-default)", borderRadius: "6px", background: "var(--color-canvas-default)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Department / Faculty</label>
              <input
                type="text"
                placeholder="e.g. Physics"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--color-border-default)", borderRadius: "6px", background: "var(--color-canvas-default)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Assigned Role</label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="form-select w-full"
                style={{ padding: "8px", fontSize: "13px", borderRadius: "6px", border: "1px solid var(--color-border-default)", background: "var(--color-canvas-default)" }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "end", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 600,
              background: "transparent",
              color: "var(--color-fg-default)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={(provider === "google" && selectedPresetIndex === null && (!customEmail || !customName)) || (provider === "sso" && (!customEmail || !customName))}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
              background: "var(--avatar-theme-color, #111827)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              opacity: ((provider === "google" && selectedPresetIndex === null && (!customEmail || !customName)) || (provider === "sso" && (!customEmail || !customName))) ? 0.5 : 1,
            }}
          >
            Authorize & Sign In
          </button>
        </div>

      </div>
    </Modal>
  );
}
