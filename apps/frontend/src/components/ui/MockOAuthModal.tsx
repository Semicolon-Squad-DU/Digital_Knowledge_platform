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

const INSTITUTIONS = [
  // Bangladesh
  "University of Dhaka",
  "Bangladesh University of Engineering and Technology (BUET)",
  "Jahangirnagar University",
  "University of Rajshahi",
  "Chittagong University",
  "Khulna University",
  "Islamic University of Technology",
  "Daffodil International University",
  "BRAC University",
  "North South University",
  "Dhaka University of Engineering and Technology",
  "Shahjalal University of Science and Technology",
  "Mawlana Bhashani Science and Technology University",
  "Rajshahi University of Engineering and Technology",
  "Sylhet International University",
  "Pabna Science and Technology University",
  "Independent University Bangladesh",
  "American International University-Bangladesh",
  "East West University",
  
  // United Kingdom
  "University of Oxford",
  "University of Cambridge",
  "Imperial College London",
  "UCL (University College London)",
  "London School of Economics (LSE)",
  "University of Edinburgh",
  "University of Manchester",
  "King's College London",
  "University of Bristol",
  "University of Warwick",
  "University of Southampton",
  "University of Bath",
  "University of Leeds",
  "University of Durham",
  "University of Glasgow",
  "University of Sheffield",
  "University of Nottingham",
  "University of Birmingham",
  "University of Liverpool",
  "Queen Mary University of London",
  
  // United States
  "Harvard University",
  "Stanford University",
  "MIT (Massachusetts Institute of Technology)",
  "California Institute of Technology",
  "Princeton University",
  "Yale University",
  "University of Chicago",
  "Columbia University",
  "University of Pennsylvania",
  "Northwestern University",
  "Duke University",
  "University of Michigan",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of Southern California",
  "Cornell University",
  "University of Texas at Austin",
  "Carnegie Mellon University",
  "University of Washington",
  "University of Wisconsin-Madison",
  
  // Canada
  "University of Toronto",
  "McGill University",
  "University of British Columbia",
  "McMaster University",
  "University of Alberta",
  "University of Montreal",
  "University of Waterloo",
  "Western University",
  "University of Ottawa",
  "University of Calgary",
  
  // Australia
  "University of Melbourne",
  "University of Sydney",
  "University of New South Wales",
  "University of Queensland",
  "Australian National University",
  "University of Western Australia",
  "Monash University",
  "University of Adelaide",
  "University of Technology Sydney",
  "RMIT University",
  
  // Germany
  "Heidelberg University",
  "Ludwig Maximilian University of Munich",
  "Technical University of Munich",
  "University of Berlin",
  "University of Hamburg",
  "University of Frankfurt",
  "University of Cologne",
  "University of Mannheim",
  "Karlsruhe Institute of Technology",
  "University of Bonn",
  
  // France
  "Sorbonne University",
  "Paris-Saclay University",
  "PSL University",
  "University of Lyon",
  "University of Toulouse",
  "University of Marseille",
  "University of Montpellier",
  "University of Paris-Cité",
  "INSEAD",
  "HEC Paris",
  
  // Japan
  "University of Tokyo",
  "Kyoto University",
  "Osaka University",
  "Tokyo Institute of Technology",
  "Tohoku University",
  "Keio University",
  "Waseda University",
  "Hitotsubashi University",
  "University of Tsukuba",
  "Nagoya University",
  
  // India
  "Indian Institute of Technology (IIT) Delhi",
  "Indian Institute of Technology (IIT) Bombay",
  "Indian Institute of Science (IISc)",
  "University of Delhi",
  "Jawaharlal Nehru University",
  "Banaras Hindu University",
  "University of Mumbai",
  "University of Calcutta",
  "Aligarh Muslim University",
  "Anna University",
];

const ROLES = [
  { value: "member", label: "Member" },
  { value: "student_author", label: "Student Author" },
  { value: "researcher", label: "Researcher" },
  { value: "archivist", label: "Archivist" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

const GOOGLE_ACCOUNTS = [
  { email: "student@dku.edu.bd", name: "Student User", role: "student_author", dept: "Computer Science & Engineering" },
  { email: "researcher@dku.edu.bd", name: "Researcher User", role: "researcher", dept: "Computer Science & Engineering" },
  { email: "librarian@dku.edu.bd", name: "Librarian User", role: "librarian", dept: "Library Services" },
  { email: "member@dku.edu.bd", name: "Member User", role: "member", dept: "General" },
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
                placeholder=""
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--color-border-default)", borderRadius: "6px", background: "var(--color-canvas-default)" }}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Email Address</label>
              <input
                type="email"
                placeholder=""
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px", border: "1px solid var(--color-border-default)", borderRadius: "6px", background: "var(--color-canvas-default)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-default)" }}>Department / Faculty</label>
              <input
                type="text"
                placeholder=""
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
