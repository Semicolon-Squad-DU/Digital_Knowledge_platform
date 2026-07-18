"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Archive, FlaskConical, Send,
  BookOpen, ShieldCheck, Bell, Heart, LogOut,
  Calendar, Menu, X, GraduationCap, Camera,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useIdleLogout } from "@/hooks/useIdleLogout";

export const APP_NAV = [
  { label: "Dashboard",   guestLabel: undefined,    href: "/dashboard",  icon: LayoutDashboard, public: false, roles: undefined },
  { label: "Archive",     guestLabel: undefined,    href: "/archive",    icon: Archive,         public: true,  roles: undefined },
  { label: "Research",    guestLabel: undefined,    href: "/research",   icon: FlaskConical,    public: true,  roles: undefined },
  { label: "Showcase",    guestLabel: "Showcase",   href: "/showcase",   icon: Send,            public: true,  roles: undefined },
  { label: "Library",     guestLabel: undefined,    href: "/library",    icon: BookOpen,        public: true,  roles: undefined },
  { label: "Events",      guestLabel: undefined,    href: "/events",     icon: Calendar,        public: false, roles: undefined },
  { label: "Librarian",   guestLabel: undefined,    href: "/librarian",  icon: BookOpen,        public: false, roles: ["librarian"] as string[] },
  { label: "Admin",       guestLabel: undefined,    href: "/admin",      icon: ShieldCheck,     public: false, roles: ["admin"] as string[] },
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
      style={{ textDecoration: "none", display: "block", marginBottom: 3, position: "relative" }}
    >
      {active && (
        <span style={{
          position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 18, borderRadius: 3, background: "#fff",
        }} />
      )}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "8px 12px", borderRadius: 10, cursor: "pointer",
          fontSize: 13.5, fontWeight: active ? 700 : 500, letterSpacing: "-0.005em",
          color: active ? "#fff" : "rgba(255,255,255,0.62)",
          background: active ? "rgba(255,255,255,0.14)" : "transparent",
          boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "none",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.62)";
          }
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? "rgba(255,255,255,0.16)" : "transparent",
        }}>
          <Icon size={14.5} strokeWidth={active ? 2.4 : 2} style={{ opacity: active ? 1 : 0.75 }} />
        </div>
        <span>{label}</span>
      </div>
    </Link>
  );
}

// ── Logo block ────────────────────────────────────────────────────────────────
function SidebarBrand({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{
      height: 64, padding: "0 16px 10px 18px",
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      flexShrink: 0, position: "relative",
    }}>
      {/* Soft fade divider instead of a hard 1px line */}
      <div style={{
        position: "absolute", left: 18, right: 18, bottom: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14) 50%, transparent)",
      }} />
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "rgba(255,255,255,0.14)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), 0 2px 8px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GraduationCap size={16} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: "clamp(13px, 2vw, 17px)", fontWeight: 800, color: "#fff", margin: 0,
            lineHeight: 1.2, letterSpacing: "-0.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>Digital Knowledge</p>
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", margin: "2px 0 0", letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Academic Portal</p>
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
    <div style={{ padding: "10px 10px 14px", flexShrink: 0, position: "relative" }}>
      <div style={{
        position: "absolute", left: 18, right: 18, top: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14) 50%, transparent)",
      }} />
      <Link href="/profile" style={{ textDecoration: "none", display: "block", marginBottom: 8, marginTop: 2 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12.5, fontWeight: 700, color: "#fff",
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              {user.name?.split(" ")[0]}
            </p>
            <span style={{
              display: "inline-block", fontSize: 10, color: "rgba(255,255,255,0.75)",
              margin: "3px 0 0", textTransform: "capitalize", letterSpacing: "0.02em", fontWeight: 600,
              padding: "1px 7px", borderRadius: 5, background: "rgba(255,255,255,0.1)",
            }}>
              {user.role?.replace("_", " ")}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={onLogout}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          padding: "8px 10px", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
          cursor: "pointer", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)",
          transition: "all 0.15s ease",
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
function NavList({ pathname, isAuthenticated, role, onNav }: { pathname: string; isAuthenticated: boolean; role?: string; onNav?: () => void }) {
  const visibleNav = APP_NAV.filter(item => {
    if (!isAuthenticated) return item.public;
    if (item.roles) return item.roles.includes(role ?? "");
    return true;
  });
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
  borderRadius: "0",
  boxShadow: "4px 0 28px rgba(0,0,0,0.18)",
  display: "flex", flexDirection: "column",
  height: "100%", overflowY: "auto", overflowX: "hidden",
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
          {isMobile ? (
            /* MOBILE: Hamburger and Logo both on left */
            <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "flex-start", gap: "8px" }}>
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "8px", color: "#111827", marginLeft: "-8px" }}
              >
                <Menu size={22} />
              </button>
              <GuestBrand />
            </div>
          ) : (
            /* DESKTOP: Logo on left, center nav + right auth */
            <>
              <GuestBrand />
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
        <>
          {/* Backdrop / Overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 199,
              animation: "fadeIn 0.25s ease-out",
            }}
          />
          {/* Sidebar content */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "80%",
            height: "100%",
            backgroundImage: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, #111116 100%)",
            color: "#ffffff",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
            animation: "slideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}>
            {/* Menu top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <GuestBrand />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "rgba(255,255,255,0.75)" }}>
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* User Info Header (Guest Mode) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--avatar-theme-color, #111827)", boxShadow: "0 4px 12px rgba(0,0,0,0.24)" }}>
                <GraduationCap size={32} />
              </div>
              <div>
                <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Guest User</p>
                <span style={{ fontSize: "11px", color: "#f87171", background: "rgba(239, 68, 68, 0.2)", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>Guest Mode</span>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
              {GUEST_NAV.map(({ label, href }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.75)",
                      textDecoration: "none",
                      borderRadius: "8px",
                      letterSpacing: "0.01em",
                      background: active ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.color = "#ffffff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = active ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                  >{label}</Link>
                );
              })}
            </div>

            {/* Drawer Auth Actions Footer */}
            <div style={{ padding: "12px 16px 20px 16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10.5px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#ffffff",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1.5px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.2s"
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10.5px",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    background: "#ffffff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </>
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

  useIdleLogout(isAuthenticated);

  const handleLogout = async () => { await logout(); router.push("/"); };
  const closeDrawer = () => setOpen(false);

  // Lock background scroll while the mobile drawer is open — iOS Safari lets touch
  // scrolls propagate through a fixed overlay even when an ancestor has
  // overflow:hidden, so the home page behind the menu could still be dragged.
  // Only the drawer's own nav list (flex:1, overflowY:auto) should move.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f2f5" }}>

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={SIDEBAR_STYLE}>
          <SidebarBrand />
          <nav style={{ flex: 1, overflowY: "auto" }}>
            <NavList pathname={pathname} isAuthenticated={isAuthenticated} role={user?.role} />
          </nav>
          <UserFooter user={user} onLogout={handleLogout} />
        </aside>
      )}

      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          {open && (
            <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 39 }} />
          )}
          <div style={{
            position: "fixed", left: 0, top: 0, width: "80%", height: "100dvh",
            backgroundImage: "linear-gradient(135deg, var(--avatar-theme-color, #1a1a2e) 0%, #111116 100%)",
            borderRight: "none", borderRadius: "0",
            boxShadow: "4px 0 32px rgba(0,0,0,0.22)", overflow: "hidden",
            display: "flex", flexDirection: "column", zIndex: 40,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <SidebarBrand onClose={closeDrawer} />

            {/* Centered User Info Header (similar to landing page) */}
            {user && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <Link href="/profile" onClick={closeDrawer} style={{ position: "relative", textDecoration: "none", display: "block", cursor: "pointer" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "var(--avatar-theme-color, #111827)", boxShadow: "0 4px 12px rgba(0,0,0,0.24)" }}>
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "22px", height: "22px", borderRadius: "50%", background: "var(--avatar-theme-color, #111827)", border: "2px solid #111116", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                    <Camera size={11} color="#ffffff" strokeWidth={2.5} />
                  </div>
                </Link>
                <div>
                  <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>{user?.name}</p>
                  <span style={{ fontSize: "11px", color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: "10px", fontWeight: 600, textTransform: "capitalize" }}>
                    {user?.role?.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto" }}>
              <NavList pathname={pathname} isAuthenticated={isAuthenticated} role={user?.role} onNav={closeDrawer} />
            </div>

            {/* Mobile Drawer Auth Footer */}
            <div style={{ padding: "12px 16px 20px 16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
              <button
                onClick={() => { handleLogout(); closeDrawer(); }}
                style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", fontSize: "13.5px", fontWeight: 600, color: "#fca5a5", background: "rgba(239, 68, 68, 0.15)", border: "1.5px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
        <header style={{
          height: 64, background: "#fff", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
          flexShrink: 0, zIndex: 30,
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
