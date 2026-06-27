"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, User, LogOut, Menu, X, LayoutDashboard, Library, Search, Moon, Sun, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
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

export function Navbar({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = useRef(50);
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
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at top of page
      if (currentScrollY <= 0) {
        setIsVisible(true);
        setIsScrolled(false);
      } else if (currentScrollY > scrollThreshold.current) {
        // Scrolling down - hide navbar
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } 
        // Scrolling up - show navbar
        else {
          setIsVisible(true);
        }
        setIsScrolled(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    setDropdownOpen(false);
  }, [pathname]);

  const isLibrarianOrAdmin = ["librarian", "admin"].includes(user?.role ?? "");

  // Hide navbar on pages that have their own navigation
  const hiddenExact    = ["/", "/login", "/register", "/forgot-password"];
  const hiddenPrefixes = ["/dashboard", "/library", "/archive", "/research", "/showcase", "/librarian", "/notifications", "/search"];
  if (
    hiddenExact.includes(pathname) ||
    hiddenPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) return null;

  return (
    <>
      {/* GitHub-style dark header */}
      <header 
        className={cn(
          "gh-navbar sticky top-0 z-40 transition-all duration-300"
        )}
        style={{
          background: isScrolled 
            ? "rgba(36, 41, 47, 0.98)" 
            : "#24292f",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          boxShadow: isScrolled ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "none",
          padding: isScrolled ? "6px 0" : "8px 0",
          transform: isVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? "visible" : "hidden",
        }}
        role="banner"
      >
        <div className="page-container">
          <div className={cn("flex items-center gap-4", isScrolled ? "h-12" : "h-14")}>

            {/* Back Button if showBack is true */}
            {showBack && (
              <button
                onClick={() => router.back()}
                className="flex items-center text-sm font-bold text-white/80 hover:text-white transition-colors duration-100 mr-2 bg-transparent"
                aria-label="Go back"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
            )}

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
                  {pathname !== "/profile" && (
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
                          className="absolute rounded-md border shadow-lg animate-scale-in overflow-hidden z-50 max-sm:fixed max-sm:inset-4 max-sm:bottom-auto max-sm:top-16 max-sm:w-auto max-sm:right-0"
                          style={{
                            background: "var(--color-canvas-default)",
                            borderColor: "var(--color-border-default)",
                            boxShadow: "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
                            right: 0,
                            marginTop: 4,
                            width: 280,
                          }}
                          role="menu"
                        >
                          {/* User info */}
                          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border-default)" }}>
                            <p className="text-xs font-semibold" style={{ color: "var(--color-fg-muted)" }}>Signed in as</p>
                            <p className="text-sm font-semibold truncate mt-0.5" style={{ color: "var(--color-fg-default)" }}>{user?.name}</p>
                            <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-fg-muted)" }}>{user?.email}</p>
                            <span className={cn(
                              "inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold",
                              {
                               "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300": user?.role === "admin",
                               "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300": user?.role === "librarian",
                               "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300": user?.role === "researcher",
                               "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300": user?.role === "archivist",
                               "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300": user?.role === "student_author",
                               "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300": user?.role === "member" || user?.role === "guest",
                              }
                            )}>
                              {{
                                admin:          "Admin",
                                librarian:      "Librarian",
                                researcher:     "Researcher",
                                archivist:      "Archivist",
                                student_author: "Student Author",
                                member:         "Member",
                                guest:          "Guest",
                              }[user?.role ?? "guest"] ?? user?.role}
                            </span>
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
                              onClick={async () => {
                                await logout();
                                setDropdownOpen(false);
                                router.push("/");
                              }}
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
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-100"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-[#1f2328] bg-white hover:bg-white/90 transition-colors duration-100"
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
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "#24292f", animation: "slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards" }}
          >
            <div className="page-container py-2 space-y-0.5">
              {/* Mobile search */}
              <button
                onClick={() => { setCmdOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-200"
              >
                <Search size={14} />
                Search…
              </button>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
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
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
