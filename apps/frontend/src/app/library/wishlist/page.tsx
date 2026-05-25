"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Heart, BookOpen, Trash2, BookMarked, ArrowRight,
  LayoutDashboard, Archive, Send, Library, ShieldCheck,
  Bell, Search, Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlist, useRemoveFromWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WishlistItem {
  wishlist_id: string;
  catalog_id: string;
  title: string;
  authors: string[];
  available_copies: number;
  added_at: string;
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Archive",     href: "/archive",   icon: Archive },  { label: "Research",    href: "/research",  icon: Archive },  { label: "Submissions", href: "/showcase",  icon: Send },
  { label: "Library",     href: "/library",   icon: Library },
  { label: "Admin",       href: "/admin", icon: ShieldCheck },
];

// ── Wishlist Card ─────────────────────────────────────────────────────────────
function WishlistCard({
  item,
  onRemove,
  onHold,
  isRemoving,
  isHolding,
}: {
  item: WishlistItem;
  onRemove: (id: string, title: string) => void;
  onHold: (id: string) => void;
  isRemoving: boolean;
  isHolding: boolean;
}) {
  const isAvailable = item.available_copies > 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
    >
      {/* Book Icon */}
      <div
        style={{
          width: 48,
          height: 56,
          borderRadius: 6,
          flexShrink: 0,
          background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BookOpen size={20} color="#fff" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/library/${item.catalog_id}`}
          style={{
            textDecoration: "none",
            display: "block",
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              lineHeight: 1.4,
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.style.textDecoration = "underline")}
            onMouseLeave={e => (e.style.textDecoration = "none")}
          >
            {item.title}
          </h3>
        </Link>

        {item.authors?.length > 0 && (
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px" }}>
            {item.authors.slice(0, 2).join(", ")}
          </p>
        )}

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: isAvailable ? "#e8f0fe" : "#fde8e8",
            color: isAvailable ? "#1a56db" : "#c81e1e",
          }}
        >
          {isAvailable ? `${item.available_copies} available` : "All on loan"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {isAvailable ? (
          <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <ArrowRight size={13} />
              View
            </button>
          </Link>
        ) : (
          <button
            onClick={() => onHold(item.catalog_id)}
            disabled={isHolding}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
              color: "#fff",
              cursor: isHolding ? "not-allowed" : "pointer",
              opacity: isHolding ? 0.6 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (!isHolding) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <BookMarked size={13} />
            {isHolding ? "Placing..." : "Place Hold"}
          </button>
        )}

        <button
          onClick={() => onRemove(item.catalog_id, item.title)}
          disabled={isRemoving}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: isRemoving ? "not-allowed" : "pointer",
            color: "#9ca3af",
            transition: "color 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isRemoving ? 0.6 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
          aria-label="Remove from wishlist"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { data: wishlist, isLoading, refetch } = useWishlist();
  const { mutateAsync: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist();
  const { mutateAsync: placeHold, isPending: isHolding } = usePlaceHold();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);

  const unreadCount = notifData?.unread_count ?? 0;

  const handleRemove = async (catalogId: string, title: string) => {
    try {
      await removeFromWishlist(catalogId);
      toast.success(`"${title}" removed from wishlist`);
      refetch();
    } catch {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleHold = async (catalogId: string) => {
    try {
      await placeHold(catalogId);
      toast.success("Hold placed — you'll be notified when available");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not place hold");
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>
            Digital Knowledge
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, margin: "2px 0 0" }}>Academic Portal</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 6,
                    marginBottom: 2,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#111827" : "#6b7280",
                    background: active ? "#f3f4f6" : "transparent",
                    borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                    transition: "all 0.1s",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ════════════════ MAIN COLUMN ════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* ── TOP BAR ── */}
        <header
          style={{
            height: 60,
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            gap: 16,
            flexShrink: 0,
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "7px 14px",
              flex: 1,
              maxWidth: 340,
            }}
          >
            <Search size={14} color="#9ca3af" />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Search knowledge base...</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#9ca3af",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                padding: "1px 6px",
                fontFamily: "monospace",
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Link
              href="/notifications"
              style={{
                position: "relative",
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <Bell size={18} color="#6b7280" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ef4444",
                    border: "2px solid #fff",
                  }}
                />
              )}
            </Link>
            <Link
              href="/library/wishlist"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <Heart size={18} color="#2563eb" />
            </Link>
            {/* Avatar */}
            <Link
              href="/profile"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#4b5563",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                overflow: "hidden",
                textDecoration: "none",
              }}
            >
              {user.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {/* Page heading row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
                My Wishlist
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {wishlist?.length ?? 0} book{wishlist && wishlist.length !== 1 ? "s" : ""} saved to read later
              </p>
            </div>
            <Link
              href="/library"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} />
              Browse Catalog
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "20px 24px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <Skeleton className="w-12 h-14 rounded shrink-0" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="w-9 h-9" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!wishlist || wishlist.length === 0) && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "60px 32px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Heart size={24} color="#9ca3af" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
                Your wishlist is empty
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                Browse the library catalog and click the heart icon to save books for later.
              </p>
              <Link
                href="/library"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Browse Catalog
              </Link>
            </div>
          )}

          {/* Wishlist Items */}
          {!isLoading && wishlist && wishlist.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {wishlist.map((item: WishlistItem) => (
                <WishlistCard
                  key={item.wishlist_id}
                  item={item}
                  onRemove={handleRemove}
                  onHold={handleHold}
                  isRemoving={isRemoving}
                  isHolding={isHolding}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
