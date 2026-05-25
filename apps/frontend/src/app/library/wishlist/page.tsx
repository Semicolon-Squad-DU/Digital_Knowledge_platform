"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, BookOpen, Trash2, BookMarked, ArrowRight, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlist, useRemoveFromWishlist, usePlaceHold } from "@/hooks/useLibrary";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface WishlistItem {
  wishlist_id: string;
  catalog_id: string;
  title: string;
  authors: string[];
  available_copies: number;
  added_at: string;
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
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
    >
      {/* Book spine icon */}
      <div style={{
        width: 48, height: 56, borderRadius: 6, flexShrink: 0,
        background: "#1a1a2e",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BookOpen size={20} color="#fff" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px", lineHeight: 1.4 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            {item.title}
          </h3>
        </Link>
        {item.authors?.length > 0 && (
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px" }}>
            {item.authors.slice(0, 2).join(", ")}
          </p>
        )}
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "3px 10px", borderRadius: 4,
          fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
          background: isAvailable ? "#e8f0fe" : "#fde8e8",
          color: isAvailable ? "#1a56db" : "#c81e1e",
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
              padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              border: "none", background: "#111827", color: "#fff", cursor: "pointer",
            }}>
              <ArrowRight size={13} /> View
            </button>
          </Link>
        ) : (
          <button
            onClick={() => onHold(item.catalog_id)}
            disabled={isHolding}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
              border: "none", background: "#111827", color: "#fff",
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
            padding: 8, borderRadius: 6, border: "none", background: "transparent",
            cursor: isRemoving ? "not-allowed" : "pointer",
            color: "#9ca3af", display: "flex", alignItems: "center",
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

export default function WishlistPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login?redirect=/library/wishlist");
  }, [isAuthenticated, router]);

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
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
              My Wishlist
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              {wishlist?.length ?? 0} book{wishlist?.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link href="/library" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: "#fff", background: "#111827", textDecoration: "none",
          }}>
            <Plus size={14} /> Browse Catalog
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
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
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Heart size={24} color="#9ca3af" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Your wishlist is empty</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 auto 24px", maxWidth: 320 }}>
              Browse the library catalog and click the heart icon to save books for later.
            </p>
            <Link href="/library" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: "#111827", textDecoration: "none" }}>
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
