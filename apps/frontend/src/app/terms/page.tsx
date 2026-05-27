"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div style={{
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background: "var(--theme-gradient-160)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Mock Content */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        background: "#f9fafb",
        zIndex: 0
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: "28px", width: "200px", background: "#e5e7eb", borderRadius: "6px" }} />
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ height: "36px", width: "80px", background: "#e5e7eb", borderRadius: "6px" }} />
            <div style={{ height: "36px", width: "36px", borderRadius: "50%", background: "#e5e7eb" }} />
          </div>
        </div>
      </div>

      {/* Backdrop blur overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        background: "rgba(0, 0, 0, 0.4)",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* Header */}
      <header style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
        position: "relative",
        zIndex: 2
      }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--avatar-theme-color, #000000)",
            textDecoration: "none",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 32px", position: "relative", zIndex: 2 }}>
        <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#111827", marginBottom: "12px", lineHeight: 1.2 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "32px" }}>
          Last updated: May 28, 2026
        </p>

        {/* Content Sections */}
        <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.3)", padding: "32px", lineHeight: 1.8, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}>
          {/* Section 1 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              By accessing and using the Digital Knowledge Platform (DKP), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              2. Use License
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              Permission is granted to temporarily download one copy of the materials (information or software) on the Digital Knowledge Platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ fontSize: "14px", color: "#495057", marginLeft: "24px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "8px" }}>Modifying or copying the materials</li>
              <li style={{ marginBottom: "8px" }}>Using the materials for any commercial purpose or for any public display</li>
              <li style={{ marginBottom: "8px" }}>Attempting to decompile or reverse engineer any software contained on the platform</li>
              <li style={{ marginBottom: "8px" }}>Removing any copyright or other proprietary notations from the materials</li>
              <li style={{ marginBottom: "8px" }}>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              3. Disclaimer
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              The materials on the Digital Knowledge Platform are provided on an &apos;as is&apos; basis. The platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              4. Limitations
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              In no event shall the Digital Knowledge Platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the platform, even if the platform or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              5. Accuracy of Materials
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              The materials appearing on the Digital Knowledge Platform could include technical, typographical, or photographic errors. The platform does not warrant that any of the materials on the platform are accurate, complete, or current. The platform may make changes to the materials contained on the platform at any time without notice.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              6. Links
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              The Digital Knowledge Platform has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by the platform of the site. Use of any such linked website is at the user&apos;s own risk.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              7. Modifications
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              The Digital Knowledge Platform may revise these terms of service for the platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              8. Governing Law
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              These terms and conditions are governed by and construed in accordance with the laws of Bangladesh, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              9. Contact Information
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p style={{ fontSize: "14px", color: "#495057" }}>
              Email: support@dkp.edu.bd<br />
              Address: University of Dhaka, Dhaka, Bangladesh
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "rgba(255, 255, 255, 0.1)", borderTop: "1px solid rgba(255, 255, 255, 0.2)", marginTop: "48px", position: "relative", zIndex: 2 }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 32px",
          display: "grid",
          gridTemplateColumns: "200px 1fr auto",
          alignItems: "start",
          gap: "32px",
        }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", lineHeight: 1.55, margin: "0 0 6px" }}>
              Digital Knowledge Platform
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
              © 2026 Digital Knowledge Platform. All rights reserved.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Contact Us", href: "/contact" }
              ].map((l) => (
                <Link key={l.label} href={l.href} style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.8)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
