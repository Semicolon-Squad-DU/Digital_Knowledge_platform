"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Quote, Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AccessTierBadge } from "@/components/ui/AccessTierBadge";
import toast from "react-hot-toast";

export interface CatalogItem {
  catalog_id: string;
  title: string;
  authors: string[];
  description?: string;
  category?: string;
  year?: number;
  isbn?: string;
  publisher?: string;
  available_copies: number;
  total_copies: number;
  created_at: string;
  access_tier?: string;
  view_count?: number;
}

// ── Loan status badge ─────────────────────────────────────────────────────────
// Physical-copy availability — same colors/wording as the item detail page,
// shown separately from AccessBadge so the two concepts don't get conflated.
function LoanStatusBadge({ copies }: { copies: number }) {
  const available = copies > 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      background: available ? "#e6f4ea" : "#fde8e8",
      color: available ? "#1e7e34" : "#c81e1e",
    }}>
      {available ? `${copies} AVAILABLE` : "ALL ON LOAN"}
    </span>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────
export function ResultCard({ item, onDelete, onWishlist, isLibrarian, isAuthenticated }: {
  item: CatalogItem; onDelete?: () => void;
  onWishlist?: () => void; isLibrarian: boolean; isAuthenticated: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const typeLabel = item.category ?? "Article";
  const dateStr   = item.year ? String(item.year) : (item.created_at ? formatDate(item.created_at) : "");
  const citations = item.total_copies ?? 0;
  const views     = item.view_count ?? 0;

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.error("Sign in to add to wishlist"); return; }
    setWishlisted(true);
    onWishlist?.();
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #c8c5cd", borderRadius: 8,
      padding: "20px 24px", position: "relative",
    }}>
      {/* Top row: badge + type/date + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AccessTierBadge tier={item.access_tier} />
          <LoanStatusBadge copies={item.available_copies} />
          <span style={{ fontSize: 13, color: "#555f6d" }}>
            {typeLabel} • {dateStr}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Wishlist heart button */}
          <button
            onClick={handleWishlist}
            title={wishlisted ? "Added to wishlist" : "Add to wishlist"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center",
              color: wishlisted ? "#ef4444" : "#78767d",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { if (!wishlisted) e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { if (!wishlisted) e.currentTarget.style.color = "#78767d"; }}
          >
            <Heart size={16} fill={wishlisted ? "#ef4444" : "none"} />
          </button>
          {/* Delete — librarians only */}
          {isLibrarian && onDelete && (
            <button
              onClick={onDelete}
              title="Remove from catalog"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#78767d" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#78767d")}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: "#141b2b",
          lineHeight: 1.4, marginBottom: 6,
          cursor: "pointer",
        }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
        >
          {item.title}
        </h3>
      </Link>

      {/* Authors */}
      {item.authors?.length > 0 && (
        <p style={{ fontSize: 13, color: "#0D47A1", marginBottom: 8 }}>
          {item.authors.join(", ")}
        </p>
      )}

      {/* Abstract excerpt */}
      {item.description && (
        <p style={{
          fontSize: 13, color: "#47464c", fontStyle: "italic",
          lineHeight: 1.6, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          &ldquo;{item.description}&rdquo;
        </p>
      )}

      {/* Footer: citations + views */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555f6d" }}>
          <Quote size={12} /> {citations} Citations
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555f6d" }}>
          <Eye size={12} /> {views.toLocaleString()} Views
        </span>
      </div>
    </div>
  );
}
