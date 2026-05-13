"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, LogOut, Menu, X, LayoutDashboard, Library } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/ui/CommandPalette";

const topNav = [
  { href: "/archive", label: "Archive" },
  { href: "/research", label: "Research" },
  { href: "/showcase", label: "Showcase" },
  { href: "/library", label: "Wiki" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifData } = useNotifications(1, true, isAuthenticated);
  const unreadCount = notifData?.unread_count ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isLibrarianOrAdmin = ["librarian", "admin"].includes(user?.role ?? "");

  return (
    <>
      <header
        className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 sm:px-6 h-16 max-w-full z-40 shrink-0 sticky top-0"
        role="banner"
      >
        <div className="flex items-center gap-6 lg:gap-8 h-full min-w-0 flex-1">
          <Link href="/" className="flex items-center shrink-0" aria-label="DKP Home">
            <span className="text-lg sm:text-xl font-display font-black tracking-tighter text-on-surface truncate">
              <span className="sm:hidden">DKP</span>
              <span className="hidden sm:inline">DKP // University Archive</span>
            </span>
          </Link>

          <nav className="hidden md:flex h-full items-center gap-1 font-body text-sm tracking-tight" aria-label="Main navigation">
            {topNav.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center h-full px-2 transition-colors rounded-sm",
                    active
                      ? "text-primary border-b-2 border-primary font-semibold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-full py-1.5 pl-9 pr-3 text-sm text-on-surface-variant hover:border-primary/40 hover:text-on-surface transition-colors w-40 lg:w-56 text-left"
              aria-label="Search archive (Ctrl+K)"
            >
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
                search
              </span>
              <span className="truncate">Search archive…</span>
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-2 rounded-full transition-colors relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <span className="material-symbols-outlined text-xl leading-none">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" aria-hidden />
                )}
              </Link>

              <Link
                href="/profile"
                className="hidden sm:inline-flex text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-2 rounded-full transition-colors"
                aria-label="Settings"
              >
                <span className="material-symbols-outlined text-xl leading-none">settings</span>
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center rounded-full border border-outline-variant hover:ring-2 hover:ring-primary/30 transition-all ml-0.5"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-lg border border-outline-variant bg-surface-container shadow-lg overflow-hidden z-50 animate-scale-in"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant">
                      <p className="text-xs font-medium text-on-surface-variant">Signed in as</p>
                      <p className="text-sm font-semibold text-on-surface truncate mt-0.5">{user?.name}</p>
                    </div>
                    <div className="py-1">
                      {[
                        { href: "/dashboard", icon: LayoutDashboard, label: "Your dashboard" },
                        { href: "/profile", icon: User, label: "Your profile" },
                        ...(isLibrarianOrAdmin ? [{ href: "/librarian", icon: Library, label: "Librarian dashboard" }] : []),
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          <item.icon size={14} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="py-1 border-t border-outline-variant">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-on-surface hover:bg-error-container/30 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-on-surface-variant hover:text-on-surface px-2 py-1.5 rounded-md transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold bg-primary text-on-primary px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="md:hidden text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-2 rounded-full transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden border-b border-outline-variant bg-surface animate-slide-down">
          <div className="page-container py-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setCmdOpen(true);
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors text-left"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              Search archive…
            </button>
            {topNav.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active ? "bg-secondary-container text-primary font-bold" : "text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
