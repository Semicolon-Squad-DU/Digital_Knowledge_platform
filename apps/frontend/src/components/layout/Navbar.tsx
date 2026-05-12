"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, User, LogOut, Menu, X, LayoutDashboard, Library, Search, Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/ui/CommandPalette";

const navLinks = [
  { href: "/archive",  label: "Archive" },
  { href: "/research", label: "Research" },
  { href: "/showcase", label: "Showcase" },
  { href: "/library",  label: "Library" },
];

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("dkp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dkp-theme", next ? "dark" : "light");
  };
  return { dark, toggle };
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { dark, toggle: toggleDark } = useDarkMode();
  const { data: notifData } = useNotifications(1, true, isAuthenticated);
  const unreadCount = notifData?.unread_count ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
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

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isLibrarianOrAdmin = ["librarian", "admin"].includes(user?.role ?? "");

  return (
    <>
      {/* GitHub-style dark header */}
      <header className="gh-navbar sticky top-0 z-40" role="banner">
        <div className="page-container">
          <div className="flex items-center gap-3 sm:gap-4 h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="DKP Home">
              <BookOpen size={20} className="text-white" />
              <span className="text-white font-semibold text-sm hidden sm:block">DKP</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-100",
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search trigger */}
            <div className="flex-1 max-w-xs hidden sm:block">
              <button
                onClick={() => setCmdOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white/50 border border-white/20 hover:border-white/40 hover:text-white/70 transition-colors duration-100 bg-white/5"
                aria-label="Search (Ctrl+K)"
              >
                <Search size={14} />
                <span className="flex-1 text-left">Search…</span>
                <kbd className="text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/15">⌘K</kbd>
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 ml-auto">

              {/* Dark mode */}
              <button
                onClick={toggleDark}
                className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-100"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-100"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f85149]" aria-hidden="true" />
                    )}
                  </Link>

                  {/* User menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="flex items-center p-1 rounded-full hover:ring-2 hover:ring-white/30 transition-all duration-100"
                      aria-expanded={dropdownOpen}
                      aria-haspopup="menu"
                      aria-label="User menu"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#6e7781] flex items-center justify-center text-white text-xs font-semibold">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute right-0 mt-1 w-56 rounded-md border shadow-lg animate-scale-in overflow-hidden z-50"
                        style={{
                          background: "var(--color-canvas-default)",
                          borderColor: "var(--color-border-default)",
                          boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
                        }}
                        role="menu"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border-default)" }}>
                          <p className="text-xs font-semibold" style={{ color: "var(--color-fg-muted)" }}>Signed in as</p>
                          <p className="text-sm font-semibold truncate mt-0.5" style={{ color: "var(--color-fg-default)" }}>{user?.name}</p>
                        </div>

                        <div className="py-1">
                          {[
                            { href: "/dashboard", icon: LayoutDashboard, label: "Your dashboard" },
                            { href: "/profile",   icon: User,            label: "Your profile" },
                            ...(isLibrarianOrAdmin ? [{ href: "/librarian", icon: Library, label: "Librarian dashboard" }] : []),
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-1.5 text-sm transition-colors duration-100 hover:bg-[var(--color-accent-emphasis)] hover:text-white"
                              style={{ color: "var(--color-fg-default)" }}
                            >
                              <item.icon size={14} />
                              {item.label}
                            </Link>
                          ))}
                        </div>

                        <div className="py-1 border-t" style={{ borderColor: "var(--color-border-default)" }}>
                          <button
                            role="menuitem"
                            onClick={() => { logout(); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors duration-100 hover:bg-[var(--color-danger-emphasis)] hover:text-white text-left"
                            style={{ color: "var(--color-fg-default)" }}
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
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3 rounded-md text-xs sm:text-sm text-white/85 hover:text-white hover:bg-white/10 transition-colors duration-100 whitespace-nowrap"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3 rounded-md text-xs sm:text-sm font-semibold text-[#1f2328] bg-white hover:bg-white/90 transition-colors duration-100 whitespace-nowrap shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-100"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t animate-slide-down"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "#24292f" }}
          >
            <div className="page-container py-2 space-y-0.5">
              {/* Mobile search */}
              <button
                onClick={() => { setCmdOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Search size={14} />
                Search…
              </button>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname.startsWith(link.href)
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
