"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, BookOpen, Trash2, BookMarked, ArrowRight, Plus, Calendar, Building2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlist, useRemoveFromWishlist, usePlaceHold } from "@/features/library/hooks/useLibrary";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface WishlistItem {
  wishlist_id: string;
  catalog_id: string;
  title: string;
  authors: string[];
  available_copies: number;
  added_at: string;
  category?: string;
  year?: number;
  publisher?: string;
}

function WishlistCard({ item, onRemove, onHold, isRemoving, isHolding }: {
  item: WishlistItem;
  onRemove: (id: string, title: string) => void;
  onHold: (id: string) => void;
  isRemoving: boolean;
  isHolding: boolean;
}) {
  const isAvailable = item.available_copies > 0;

  return (
    <div
      className="group"
      style={{
        background: "var(--color-canvas-default)", border: "1px solid var(--color-border-default)", borderRadius: 14,
        padding: "18px 20px", display: "flex", alignItems: "center", gap: 18,
        transition: "all 0.18s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "var(--color-fg-subtle)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = "var(--color-border-default)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Book spine icon */}
      <div style={{
        width: 52, height: 62, borderRadius: 8, flexShrink: 0,
        background: "color-mix(in srgb, var(--avatar-theme-color, #6366f1) 12%, #fff)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BookOpen size={22} color="var(--avatar-theme-color, #6366f1)" strokeWidth={1.75} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          {item.category && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "2px 8px", borderRadius: 20,
              background: "var(--color-canvas-subtle)", color: "var(--color-fg-muted)",
            }}>
              {item.category}
            </span>
          )}
          <span style={{ fontSize: 11, color: "var(--color-fg-subtle)", display: "flex", alignItems: "center", gap: 4 }}>
            <Heart size={10} fill="var(--avatar-theme-color, #6366f1)" color="var(--avatar-theme-color, #6366f1)" /> Saved {timeAgo(item.added_at)}
          </span>
        </div>

        <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--color-fg-default)", margin: "0 0 4px", lineHeight: 1.4 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            {item.title}
          </h3>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          {item.authors?.length > 0 && (
            <span style={{ fontSize: 13, color: "var(--color-fg-muted)" }}>
              {item.authors.slice(0, 2).join(", ")}
            </span>
          )}
          {item.publisher && (
            <span style={{ fontSize: 12, color: "var(--color-fg-subtle)", display: "flex", alignItems: "center", gap: 3 }}>
              <Building2 size={11} /> {item.publisher}
            </span>
          )}
          {item.year && (
            <span style={{ fontSize: 12, color: "var(--color-fg-subtle)", display: "flex", alignItems: "center", gap: 3 }}>
              <Calendar size={11} /> {item.year}
            </span>
          )}
        </div>

        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "3px 10px", borderRadius: 4,
          fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
          background: isAvailable ? "var(--color-accent-subtle)" : "var(--color-danger-subtle)",
          color: isAvailable ? "var(--color-accent-fg)" : "var(--color-danger-fg)",
        }}>
          {isAvailable ? `${item.available_copies} available` : "All on loan"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {isAvailable ? (
          <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none", background: "var(--theme-gradient-160)", color: "#fff", cursor: "pointer",
              transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <ArrowRight size={13} /> View
            </button>
          </Link>
        ) : (
          <button
            onClick={() => onHold(item.catalog_id)}
            disabled={isHolding}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none", background: "var(--theme-gradient-160)", color: "#fff",
              cursor: isHolding ? "not-allowed" : "pointer", opacity: isHolding ? 0.6 : 1,
            }}
          >
            <BookMarked size={13} /> {isHolding ? "Placing..." : "Place Hold"}
          </button>
        )}
        <button
          onClick={() => onRemove(item.catalog_id, item.title)}
          disabled={isRemoving}
          style={{
            padding: 9, borderRadius: 8, border: "1px solid var(--color-border-muted)", background: "var(--color-canvas-default)",
            cursor: isRemoving ? "not-allowed" : "pointer",
            color: "var(--color-fg-subtle)", display: "flex", alignItems: "center",
            opacity: isRemoving ? 0.6 : 1, transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--color-danger-fg)"; e.currentTarget.style.background = "var(--color-danger-subtle)"; e.currentTarget.style.borderColor = "var(--color-danger-fg)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--color-fg-subtle)"; e.currentTarget.style.background = "var(--color-canvas-default)"; e.currentTarget.style.borderColor = "var(--color-border-muted)"; }}
          aria-label="Remove from wishlist"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.push("/login?redirect=/library/wishlist");
  }, [isAuthenticated, _hasHydrated, router]);

  const { data: wishlist, isLoading, refetch } = useWishlist();
  const { mutateAsync: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist();
  const { mutateAsync: placeHold, isPending: isHolding } = usePlaceHold();

  const handleRemove = async (catalogId: string, title: string) => {
    try {
      await removeFromWishlist(catalogId);
      toast.success(`"${title}" removed from wishlist`);
      refetch();
    } catch { toast.error("Failed to remove from wishlist"); }
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
    <AppLayout>
      <div style={{ padding: "28px 32px" }}>
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-fg-default)", margin: 0, lineHeight: 1.2 }}>
              My Wishlist
            </h1>
            <p style={{ fontSize: 13, color: "var(--color-fg-muted)", marginTop: 4 }}>
              {wishlist?.length ?? 0} book{wishlist?.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link href="/library" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: "#fff", background: "var(--theme-gradient-160)", textDecoration: "none",
          }}>
            <Plus size={14} /> Browse Catalog
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "var(--color-canvas-default)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                <Skeleton className="w-12 h-14 rounded shrink-0" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-24" />
                </div>
                <div style={{ display: "flex", gap: 8 }}><Skeleton className="h-9 w-24" /><Skeleton className="w-9 h-9" /></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!wishlist || wishlist.length === 0) && (
          <div style={{ background: "var(--color-canvas-default)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-canvas-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Heart size={24} color="var(--color-fg-subtle)" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-fg-default)", margin: "0 0 8px" }}>Your wishlist is empty</h3>
            <p style={{ fontSize: 13, color: "var(--color-fg-muted)", margin: "0 auto 24px", maxWidth: 320 }}>
              Browse the library catalog and click the heart icon to save books for later.
            </p>
            <Link href="/library" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--theme-gradient-160)", textDecoration: "none" }}>
              Browse Catalog
            </Link>
          </div>
        )}

        {/* Items */}
        {!isLoading && wishlist && wishlist.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {wishlist.map((item: WishlistItem) => (
              <WishlistCard key={item.wishlist_id} item={item}
                onRemove={handleRemove} onHold={handleHold}
                isRemoving={isRemoving} isHolding={isHolding}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
