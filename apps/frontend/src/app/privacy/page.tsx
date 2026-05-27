"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "32px" }}>
          Last updated: May 28, 2026
        </p>

        {/* Content Sections */}
        <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.3)", padding: "32px", lineHeight: 1.8, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }}>
          {/* Section 1 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              1. Introduction
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              The Digital Knowledge Platform (DKP) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform, including any other media form, media channel, mobile website, or mobile application related or connected to it.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              2. Information We Collect
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              We may collect information about you in a variety of ways. The information we may collect on the platform includes:
            </p>
            <ul style={{ fontSize: "14px", color: "#495057", marginLeft: "24px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "8px" }}><strong>Personal Data:</strong> Name, email address, phone number, department, and other information you voluntarily provide</li>
              <li style={{ marginBottom: "8px" }}><strong>Account Information:</strong> Username, password, and profile information</li>
              <li style={{ marginBottom: "8px" }}><strong>Usage Data:</strong> Information about how you interact with the platform, including pages visited, time spent, and actions taken</li>
              <li style={{ marginBottom: "8px" }}><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li style={{ marginBottom: "8px" }}><strong>Content Data:</strong> Documents, research outputs, and other content you upload or create</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              3. Use of Your Information
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:
            </p>
            <ul style={{ fontSize: "14px", color: "#495057", marginLeft: "24px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "8px" }}>Create and manage your account</li>
              <li style={{ marginBottom: "8px" }}>Process your transactions and send related information</li>
              <li style={{ marginBottom: "8px" }}>Email you regarding your account or order</li>
              <li style={{ marginBottom: "8px" }}>Fulfill and manage your requests</li>
              <li style={{ marginBottom: "8px" }}>Generate a personal profile about you</li>
              <li style={{ marginBottom: "8px" }}>Increase the efficiency and operation of the platform</li>
              <li style={{ marginBottom: "8px" }}>Monitor and analyze trends, usage, and activities</li>
              <li style={{ marginBottom: "8px" }}>Notify you of updates to the platform</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              4. Disclosure of Your Information
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              We may share information we have collected about you in certain situations:
            </p>
            <ul style={{ fontSize: "14px", color: "#495057", marginLeft: "24px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "8px" }}><strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to comply with the law</li>
              <li style={{ marginBottom: "8px" }}><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
              <li style={{ marginBottom: "8px" }}><strong>Business Transfers:</strong> Your information may be transferred as part of our business assets if we are acquired or merged</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              5. Security of Your Information
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              6. Contact Us
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p style={{ fontSize: "14px", color: "#495057" }}>
              Email: privacy@dkp.edu.bd<br />
              Address: University of Dhaka, Dhaka, Bangladesh<br />
              Phone: +880-2-XXXX-XXXX
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              7. Changes to This Privacy Policy
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              We reserve the right to modify this privacy policy at any time. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>
              8. Your Rights
            </h2>
            <p style={{ fontSize: "14px", color: "#495057", marginBottom: "12px" }}>
              You have the right to:
            </p>
            <ul style={{ fontSize: "14px", color: "#495057", marginLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Access your personal information</li>
              <li style={{ marginBottom: "8px" }}>Correct inaccurate data</li>
              <li style={{ marginBottom: "8px" }}>Request deletion of your data</li>
              <li style={{ marginBottom: "8px" }}>Opt-out of certain communications</li>
              <li style={{ marginBottom: "8px" }}>Data portability</li>
            </ul>
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
