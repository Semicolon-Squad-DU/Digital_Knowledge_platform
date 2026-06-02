"use client";

import { Modal } from "./Modal";
import { AlertCircle, ArrowRight } from "lucide-react";

interface GoogleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseMock: () => void;
}

export function GoogleConfigModal({ isOpen, onClose, onUseMock }: GoogleConfigModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Sign-In Configuration Required"
      description="Connect your actual Google account by setting up a Google OAuth Client ID"
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        <div style={{
          display: "flex", gap: "12px", background: "#fffbeb", border: "1px solid #fef3c7",
          padding: "12px", borderRadius: "8px", alignItems: "start"
        }}>
          <AlertCircle size={20} color="#d97706" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
              Client ID is not configured
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#b45309", lineHeight: 1.5 }}>
              To authenticate with actual Google accounts, the application needs a Google Client ID from the Google Cloud Console.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-fg-muted)" }}>
            Setup Instructions
          </span>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--color-fg-default)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Go to the <strong>Google Cloud Console</strong> credentials page.</li>
            <li>Create an <strong>OAuth 2.0 Client ID</strong> for a Web Application.</li>
            <li>Set the Authorized JavaScript Origins to: <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "4px" }}>http://localhost:3000</code></li>
            <li>Add this variable to your local environment file at <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "4px" }}>apps/frontend/.env.local</code>:
              <pre style={{
                background: "#0f172a", color: "#38bdf8", padding: "10px", borderRadius: "6px",
                fontSize: "11px", margin: "8px 0 0 0", overflowX: "auto"
              }}>
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
              </pre>
            </li>
            <li>Restart the frontend development server.</li>
          </ol>
        </div>

        <div style={{ height: "1px", background: "var(--color-border-default)" }} />

        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <button
            type="button"
            onClick={onUseMock}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
              background: "transparent",
              color: "var(--color-accent-fg, #0969da)",
              border: "1px solid var(--color-accent-emphasis, #1f6feb)",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Use Mock Accounts Instead
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 600,
              background: "var(--avatar-theme-color, #111827)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            I Understand
          </button>
        </div>

      </div>
    </Modal>
  );
}
