"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Archive, FlaskConical, Send,
  BookOpen, ShieldCheck, Bell, Heart, LogOut,
  Calendar, Menu, X, GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const APP_NAV = [
  { label: "Dashboard",   guestLabel: undefined,    href: "/dashboard", icon: LayoutDashboard, public: false },
  { label: "Archive",     guestLabel: undefined,    href: "/archive",   icon: Archive,         public: true  },
  { label: "Research",    guestLabel: undefined,    href: "/research",  icon: FlaskConical,    public: true  },
  { label: "Submissions", guestLabel: "Showcase",   href: "/showcase",  icon: Send,            public: true  },
  { label: "Library",     guestLabel: undefined,    href: "/library",   icon: BookOpen,        public: true  },
  { label: "Events",      guestLabel: undefined,    href: "/events",    icon: Calendar,        public: false },
  { label: "Admin",       guestLabel: undefined,    href: "/admin",     icon: ShieldCheck,     public: false },
];

interface AppLayoutProps {
  children: React.ReactNode;
  topbarSearch?: React.ReactNode;
  topbarActions?: React.ReactNode;
}

// ── Shared nav link used in both sidebar and mobile drawer ────────────────────
function NavLink({ label, href, icon: Icon, active, onClick }: {
  label: string; href: string; icon: React.ElementType;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ textDecoration: "none", display: "block", marginBottom: 2 }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 8, cursor: "pointer",
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          color: active ? "#fff" : "rgba(255,255,255,0.65)",
          background: active ? "rgba(255,255,255,0.18)" : "transparent",
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
          }
        }}
      >
        <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

// ── Logo block ────────────────────────────────────────────────────────────────
function SidebarBrand({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{
      height: 64, padding: "0 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GraduationCap size={15} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: 14.5, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>Digital Knowledge</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "2px 0 0", letterSpacing: "0.01em" }}>Academic Portal</p>
        </div>
      </Link>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", padding: 4, display: "flex", borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

// ── User + sign-out footer ────────────────────────────────────────────────────
function UserFooter({ user, onLogout }: { user: any; onLogout: () => void }) {
  if (!user) return null;
  return (
    <div style={{ padding: "8px 8px 14px", borderTop: "1px solid rgba(255,255,255,0.09)", flexShrink: 0 }}>
      <Link href="/profile" style={{ textDecoration: "none", display: "block", marginBottom: 6 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              {user.name?.split(" ")[0]}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "1px 0 0", textTransform: "capitalize", letterSpacing: "0.01em" }}>
              {user.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </Link>
      <button
        onClick={onLogout}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 7,
          padding: "8px 10px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
          cursor: "pointer", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.65)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.65)";
        }}
      >
        <LogOut size={13} /> Sign Out
      </button>
    </div>
  );
}

// ── Nav items list (reused in both sidebar and drawer) ────────────────────────
function NavList({ pathname, isAuthenticated, onNav }: { pathname: string; isAuthenticated: boolean; onNav?: () => void }) {
  const visibleNav = isAuthenticated ? APP_NAV : APP_NAV.filter(item => item.public);
  return (
    <div style={{ padding: "10px 8px" }}>
      {visibleNav.map(({ label, href, icon }) => (
        <NavLink
          key={href}
          label={label}
          href={href}
          icon={icon}
          active={pathname === href || pathname.startsWith(href + "/")}
          onClick={onNav}
        />
      ))}
    </div>
  );
}

// ── Sidebar (desktop) styles ──────────────────────────────────────────────────
const SIDEBAR_STYLE: React.CSSProperties = {
  width: 224, flexShrink: 0,
  background: "var(--theme-sidebar-gradient)",
  borderRight: "none",
  borderRadius: "0 18px 18px 0",
  boxShadow: "4px 0 28px rgba(0,0,0,0.18)",
  display: "flex", flexDirection: "column",
  position: "sticky", top: 0, height: "100vh", overflowY: "auto",
  overflow: "hidden",
};

// ── Guest top navbar (replaces sidebar for unauthenticated users) ─────────────
const GUEST_NAV = [
  { label: "Archive",  href: "/archive"  },
  { label: "Library",  href: "/library"  },
  { label: "Research", href: "/research" },
  { label: "Showcase", href: "/showcase" },
  { label: "About",    href: "/about"    },
];

function GuestBrand() {
  return (
    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
      <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--avatar-theme-color, #111827)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <GraduationCap size={16} color="#ffffff" />
      </div>
      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", letterSpacing: "-0.02em" }}>DKP</span>
    </Link>
  );
}

function GuestTopNav({ pathname, isMobile, menuOpen, setMenuOpen }: {
  pathname: string; isMobile: boolean; menuOpen: boolean; setMenuOpen: (v: boolean) => void;
}) {
  return (
    <>
      {/* Top bar */}
      <header style={{ background: "#eaecef", borderBottom: "1px solid #d1d5db", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px" }}>

          <GuestBrand />

          {isMobile ? (
            /* Hamburger */
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "8px", color: "#111827" }}
            >
              <Menu size={22} />
            </button>
          ) : (
            /* Desktop: center nav + right auth */
            <>
              <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {GUEST_NAV.map(({ label, href }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      style={{ padding: "6px 14px", fontSize: "13.5px", fontWeight: 500, color: "#4b5563", textDecoration: "none", borderRadius: "6px", letterSpacing: "0.01em", transition: "all 0.2s", background: active ? "#d1d5db" : "transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#d1d5db"; e.currentTarget.style.color = "#111827"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = active ? "#d1d5db" : "transparent"; e.currentTarget.style.color = "#4b5563"; }}
                    >{label}</Link>
                  );
                })}
              </nav>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link href="/login" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 500, color: "#4b5563", textDecoration: "none", borderRadius: "8px", border: "1.5px solid #d1d5db", background: "transparent", letterSpacing: "0.01em", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#d1d5db"; e.currentTarget.style.color = "#111827"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}>Sign In</Link>
                <Link href="/register" style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, color: "#fff", textDecoration: "none", borderRadius: "8px", background: "var(--avatar-theme-color, #111827)", letterSpacing: "0.01em" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>Register</Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Full-screen mobile menu */}
      {menuOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#eaecef", zIndex: 200, display: "flex", flexDirection: "column" }}>
          {/* Menu top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "48px", borderBottom: "1px solid #d1d5db", flexShrink: 0 }}>
            <GuestBrand />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "#111827" }}>
              <X size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Nav links — same style as desktop navbar */}
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {GUEST_NAV.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "10px 14px", fontSize: "13.5px", fontWeight: 500, color: "#111827", textDecoration: "none", borderRadius: "6px", letterSpacing: "0.01em", background: active ? "#d1d5db" : "transparent" }}
                >{label}</Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function AppLayout({ children, topbarSearch, topbarActions }: AppLayoutProps) {
  const pathname        = usePathname();
  const router          = useRouter();
  const isMobile        = useMediaQuery("(max-width: 767px)");
  const [open, setOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);
  const unreadCount = notifData?.unread_count ?? 0;

  const handleLogout = async () => { await logout(); router.push("/"); };
  const closeDrawer = () => setOpen(false);

  /* ── GUEST LAYOUT: full-width with top navbar ── */
  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f0f2f5" }}>
        <GuestTopNav pathname={pathname} isMobile={isMobile} menuOpen={open} setMenuOpen={setOpen} />
        <main key={pathname} className="dkp-page-enter" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    );
  }

  /* ── AUTHENTICATED LAYOUT: sidebar + topbar ── */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={SIDEBAR_STYLE}>
          <SidebarBrand />
          <nav style={{ flex: 1, overflowY: "auto" }}>
            <NavList pathname={pathname} isAuthenticated={isAuthenticated} />
          </nav>
          <UserFooter user={user} onLogout={handleLogout} />
        </aside>
      )}

      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          {open && (
            <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 39 }} />
          )}
          <div style={{
            position: "fixed", left: 0, top: 0, width: 270, height: "100dvh",
            background: "var(--theme-sidebar-gradient)",
            borderRight: "none", borderRadius: "0 18px 18px 0",
            boxShadow: "4px 0 32px rgba(0,0,0,0.22)", overflow: "hidden",
            display: "flex", flexDirection: "column", zIndex: 40,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <SidebarBrand onClose={closeDrawer} />
            <div style={{ flex: 1, overflowY: "auto" }}>
              <NavList pathname={pathname} isAuthenticated={isAuthenticated} onNav={closeDrawer} />
            </div>
            <UserFooter user={user} onLogout={() => { handleLogout(); closeDrawer(); }} />
          </div>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{
          height: 64, background: "#fff", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
          flexShrink: 0, position: "sticky", top: 0, zIndex: 30,
        }}>
          {isMobile && (
            <button
              onClick={() => setOpen(!open)}
              aria-label="Open navigation"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, flexShrink: 0, background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", color: "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              <Menu size={20} />
            </button>
          )}

          {topbarSearch}
          {topbarActions}

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <Link
              href="/notifications"
              style={{ position: "relative", width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Bell size={18} color="#6b7280" />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
              )}
            </Link>
            <Link
              href="/library/wishlist"
              style={{ width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Heart size={18} color="#6b7280" />
            </Link>
            <Link href="/profile" style={{ textDecoration: "none", marginLeft: 2 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--avatar-theme-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </Link>
          </div>
        </header>

        <main key={pathname} className="dkp-page-enter" style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
