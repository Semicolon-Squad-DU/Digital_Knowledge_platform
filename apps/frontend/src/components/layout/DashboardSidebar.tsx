"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Archive,
  Send,
  BookOpen,
  ShieldCheck,
  FlaskConical,
  LucideIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Research", href: "/research", icon: FlaskConical },
  { label: "Submissions", href: "/showcase", icon: Send },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 200,
        background: "linear-gradient(135deg, #000000 0%, #2d2533 100%)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        position: "fixed",
        height: "100vh",
        overflowY: "auto",
        top: 0,
        left: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: "0 20px",
          height: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", lineHeight: 1.3, margin: 0 }}>
          Digital Knowledge
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "4px 0 0 0" }}>
          Academic Portal
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 6,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#000000" : "rgba(255,255,255,0.7)",
                background: isActive ? "#f3f4f6" : "transparent",
                borderLeft: isActive ? "3px solid #f3f4f6" : "3px solid transparent",
                transition: "all 0.1s",
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
