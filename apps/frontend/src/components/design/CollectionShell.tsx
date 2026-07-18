"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Library, Search, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { C, SERIF, SANS, NAV_LINKS } from "./dkpTheme";

export function CollectionShell({
  children,
  active,
  navSearch,
}: {
  children: React.ReactNode;
  /** Which collection nav link is active */
  active: "Archive" | "Library" | "Research" | "Showcase";
  /** Optional inline search shown in the desktop nav (Archive/Library designs) */
  navSearch?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div style={{ fontFamily: SANS, background: C.bg, color: C.ink, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .dkp-coll-navlink:hover { color: ${C.accent} !important; }
        .dkp-coll-btn:hover { background: ${C.accent} !important; }
        .dkp-coll-card { transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s ease, border-color .28s ease; }
        .dkp-coll-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(26,26,46,0.08); }
        @media (max-width: 900px) {
          .dkp-coll-desktop-nav { display: none !important; }
          .dkp-coll-hamburger { display: inline-flex !important; }
          .dkp-coll-nav-search { display: none !important; }
        }
      `}} />

      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: C.white, borderBottom: `1px solid ${C.lineStrong}`, boxShadow: "0 1px 3px rgba(26,26,46,0.04)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", height: 72, padding: "0 clamp(16px, 4vw, 64px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.ink, flexShrink: 0 }}>
            <Library size={22} color={C.ink} />
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>DU Digital Knowledge Platform</span>
          </Link>

          <div className="dkp-coll-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {NAV_LINKS.map((l) => {
              const isActive = l.label === active || pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="dkp-coll-navlink"
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.accent : C.body,
                    textDecoration: "none",
                    borderBottom: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                    paddingBottom: 2,
                    transition: "color .2s",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {navSearch && <div className="dkp-coll-nav-search">{navSearch}</div>}
            {!navSearch && (
              <Link href="/search" aria-label="Search" style={{ color: C.ink, padding: 8, display: "inline-flex" }}>
                <Search size={20} />
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="dkp-coll-btn dkp-coll-desktop-nav"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ink, color: C.white, fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", padding: "9px 14px", borderRadius: 6, textDecoration: "none" }}
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="dkp-coll-desktop-nav"
                  aria-label="Sign out"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: C.body, border: `1px solid ${C.lineStrong}`, fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="dkp-coll-btn"
                style={{ background: C.ink, color: C.white, fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}
              >
                Sign In
              </Link>
            )}
            <button
              className="dkp-coll-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{ display: "none", background: "transparent", border: "none", color: C.ink, cursor: "pointer", padding: 6 }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, background: C.white, zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 72, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.lineStrong}` }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: C.ink }}>DU Digital Knowledge Platform</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", color: C.ink, cursor: "pointer", padding: 6 }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ padding: "12px 14px", fontSize: 16, fontWeight: l.label === active ? 700 : 500, color: l.label === active ? C.accent : C.ink, textDecoration: "none", borderRadius: 6 }}>
                {l.label}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              onClick={() => setMenuOpen(false)}
              style={{ marginTop: 8, padding: "12px 14px", fontSize: 16, fontWeight: 600, color: C.white, background: C.ink, textDecoration: "none", borderRadius: 6, textAlign: "center" }}
            >
              {isAuthenticated ? "Go to Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{ background: C.white, borderTop: `1px solid ${C.lineStrong}`, marginTop: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px clamp(16px, 4vw, 64px)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>
            © {new Date().getFullYear()} University of Dhaka. All rights reserved.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {[
              { label: "Contact", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "About", href: "/about" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, fontWeight: 600, color: C.body, textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
