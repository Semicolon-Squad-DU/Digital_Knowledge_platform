"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Archive, FlaskConical, Send,
  BookOpen, ShieldCheck, Bell, Heart, Search, LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";

// ── Shared nav definition (single source of truth) ───────────────────────────
export const APP_NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },
  { label: "Research",    href: "/research",  icon: FlaskConical },
  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: BookOpen },
  { label: "Admin",       href: "/librarian", icon: ShieldCheck },
];

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional search bar rendered in the topbar center */
  topbarSearch?: React.ReactNode;
  /** Optional extra actions rendered in the topbar right (before bell/heart/avatar) */
  topbarActions?: React.ReactNode;
}

export function AppLayout({ children, topbarSearch, topbarActions }: AppLayoutProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);
  const unreadCount = notifData?.unread_count ?? 0;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f0f2f5",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>
            Digital Knowledge
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, marginBottom: 0 }}>
            Academic Portal
          </p>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {APP_NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 6, marginBottom: 2,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#111827" : "#6b7280",
                  background: active ? "#f3f4f6" : "transparent",
                  borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                  transition: "all 0.1s",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#374151"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; } }}
                >
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info + sign out */}
        {user && (
          <div style={{ padding: "12px 12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#1a1a2e", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name?.split(" ")[0]}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, textTransform: "capitalize" }}>
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 7,
                padding: "7px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                background: "transparent", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: "#6b7280",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* ════════ MAIN COLUMN ════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── TOP BAR ── */}
        <header style={{
          height: 60, background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center",
          padding: "0 28px", gap: 16, flexShrink: 0,
          position: "sticky", top: 0, zIndex: 30,
        }}>
          {/* Search slot */}
          {topbarSearch ?? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "7px 14px",
              flex: 1, maxWidth: 340,
            }}>
              <Search size={14} color="#9ca3af" />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Search knowledge base...</span>
              <span style={{
                marginLeft: "auto", fontSize: 11, color: "#9ca3af",
                background: "#f3f4f6", border: "1px solid #e5e7eb",
                borderRadius: 4, padding: "1px 6px", fontFamily: "monospace",
              }}>⌘K</span>
            </div>
          )}

          {/* Extra actions slot */}
          {topbarActions && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {topbarActions}
            </div>
          )}

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            {/* Bell */}
            <Link href="/notifications" style={{
              position: "relative", width: 34, height: 34, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Bell size={17} color="#6b7280" />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#ef4444", border: "2px solid #fff",
                }} />
              )}
            </Link>

            {/* Wishlist */}
            <Link href="/library/wishlist" title="My Wishlist" style={{
              width: 34, height: 34, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Heart size={17} color="#6b7280" />
            </Link>

            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#1a1a2e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
