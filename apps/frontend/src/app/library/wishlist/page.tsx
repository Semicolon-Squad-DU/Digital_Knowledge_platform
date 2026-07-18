"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, BookOpen, Trash2, BookMarked, ArrowUpRight, Plus, Calendar, Building2 } from "lucide-react";
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
  const statusColor = isAvailable ? "#059669" : "#d97706";

  return (
    <div
      style={{
        position: "relative",
        background: "#fff", border: "1px solid #f1f3ff", borderRadius: 14,
        padding: "16px 20px 16px 18px", display: "flex", alignItems: "flex-start", gap: 14,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        transition: "box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(16,24,40,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "#e2e5eb";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(16,24,40,0.04)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "#f1f3ff";
      }}
    >
      {/* Status accent bar */}
      <span style={{
        position: "absolute", left: 0, top: 14, bottom: 14, width: 3,
        borderRadius: 3, background: statusColor,
      }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${statusColor} 14%, #fff)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BookOpen size={19} color={statusColor} strokeWidth={2.1} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
          {item.category && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "2px 8px", borderRadius: 20, background: "#f1f3ff", color: "#555f6d",
            }}>
              {item.category}
            </span>
          )}
          <span style={{
            fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
            padding: "2px 8px", borderRadius: 20,
            background: `color-mix(in srgb, ${statusColor} 14%, #fff)`, color: statusColor,
          }}>
            {isAvailable ? `${item.available_copies} available` : "All on loan"}
          </span>
        </div>

        <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#141b2b", margin: "0 0 3px", lineHeight: 1.35 }}>
            {item.title}
          </h3>
        </Link>

        <p style={{ fontSize: 13, color: "#5b6371", margin: "0 0 8px", lineHeight: 1.5 }}>
          {item.authors?.length ? item.authors.slice(0, 2).join(", ") : "Unknown author"}
          {item.publisher ? ` · ${item.publisher}` : ""}
          {item.year ? ` · ${item.year}` : ""}
        </p>

        <span style={{ fontSize: 11.5, color: "#78767d", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Heart size={10} fill="#dc2626" color="#dc2626" /> Saved {timeAgo(item.added_at)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {isAvailable ? (
          <Link href={`/library/${item.catalog_id}`} title="View book">
            <button style={{
              width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", color: "#47464c", cursor: "pointer",
              transition: "all 0.15s",
            }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#f9f9ff"; e.currentTarget.style.borderColor = "#c8c5cd"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#c8c5cd"; }}
            >
              <ArrowUpRight size={14} />
            </button>
          </Link>
        ) : (
          <button
            title="Place hold"
            onClick={() => onHold(item.catalog_id)}
            disabled={isHolding}
            style={{
              width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", color: "#47464c",
              cursor: isHolding ? "not-allowed" : "pointer", opacity: isHolding ? 0.6 : 1, transition: "all 0.15s",
            }}
            onMouseOver={(e) => { if (!isHolding) { e.currentTarget.style.background = "#f9f9ff"; e.currentTarget.style.borderColor = "#c8c5cd"; } }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#c8c5cd"; }}
          >
            <BookMarked size={14} />
          </button>
        )}
        <button
          title="Remove from wishlist"
          onClick={() => onRemove(item.catalog_id, item.title)}
          disabled={isRemoving}
          style={{
            width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "1px solid #c8c5cd", background: "#fff", color: "#78767d",
            cursor: isRemoving ? "not-allowed" : "pointer", opacity: isRemoving ? 0.5 : 1, transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (!isRemoving) { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; } }}
          onMouseOut={(e) => { e.currentTarget.style.color = "#78767d"; e.currentTarget.style.borderColor = "#c8c5cd"; e.currentTarget.style.background = "#fff"; }}
        >
          <Trash2 size={14} />
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
      <div style={{ background: "#f1f3ff", minHeight: "100%" }}>

        {/* ── Hero banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f1f3ff 60%, #f1f3ff 100%)",
          borderBottom: "1px solid #c8c5cd",
          padding: "36px 40px 28px",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "var(--avatar-theme-color, #1a1a2e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 10px color-mix(in srgb, var(--avatar-theme-color, #1a1a2e) 35%, transparent)",
                }}>
                  <Heart size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#141b2b", margin: 0, letterSpacing: "-0.03em" }}>
                  My Wishlist
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#78767d", margin: 0 }}>
                {wishlist?.length ?? 0} book{wishlist?.length !== 1 ? "s" : ""} saved for later
              </p>
            </div>
            <Link href="/library" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              color: "#fff", background: "var(--avatar-theme-color, #141b2b)", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={14} /> Browse Catalog
            </Link>
          </div>
        </div>

        <div style={{ padding: "24px 32px 40px", maxWidth: 800, margin: "0 auto" }}>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #f1f3ff", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                <Skeleton className="w-[42px] h-[42px] rounded-xl shrink-0" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!wishlist || wishlist.length === 0) && (
          <div style={{ background: "#fff", border: "1px solid #f1f3ff", borderRadius: 16, padding: "64px 32px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(135deg, #f1f3ff 0%, #f1f3ff 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <Heart size={24} color="#78767d" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141b2b", margin: "0 0 6px" }}>Your wishlist is empty</h3>
            <p style={{ fontSize: 13, color: "#555f6d", margin: "0 auto 20px", maxWidth: 320 }}>
              Browse the library catalog and click the heart icon to save books for later.
            </p>
            <Link href="/library" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--theme-gradient-160)", textDecoration: "none" }}>
              Browse Catalog
            </Link>
          </div>
        )}

        {/* Items */}
        {!isLoading && wishlist && wishlist.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {wishlist.map((item: WishlistItem) => (
              <WishlistCard key={item.wishlist_id} item={item}
                onRemove={handleRemove} onHold={handleHold}
                isRemoving={isRemoving} isHolding={isHolding}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
