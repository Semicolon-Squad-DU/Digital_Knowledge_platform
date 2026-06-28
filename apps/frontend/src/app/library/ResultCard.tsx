"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Quote, Eye, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
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

// ── Access tier badge ─────────────────────────────────────────────────────────
function AccessBadge({ tier, copies }: { tier?: string; copies: number }) {
  const t = copies === 0 ? "restricted" : (tier ?? "public");
  const map: Record<string, { label: string; bg: string; color: string }> = {
    public:      { label: "OPEN ACCESS",   bg: "#111827", color: "#fff" },
    member:      { label: "INSTITUTIONAL", bg: "#1e3a5f", color: "#fff" },
    staff:       { label: "INSTITUTIONAL", bg: "#1e3a5f", color: "#fff" },
    restricted:  { label: "RESTRICTED",    bg: "#7f1d1d", color: "#fff" },
  };
  const s = map[t] ?? map.public;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      background: s.bg, color: s.color,
    }}>
      {s.label}
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
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      padding: "20px 24px", position: "relative",
    }}>
      {/* Top row: badge + type/date + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AccessBadge tier={item.access_tier} copies={item.available_copies} />
          <span style={{ fontSize: 13, color: "#6b7280" }}>
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
              color: wishlisted ? "#ef4444" : "#9ca3af",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { if (!wishlisted) e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { if (!wishlisted) e.currentTarget.style.color = "#9ca3af"; }}
          >
            <Heart size={16} fill={wishlisted ? "#ef4444" : "none"} />
          </button>
          {/* Delete — librarians only */}
          {isLibrarian && onDelete && (
            <button
              onClick={onDelete}
              title="Remove from catalog"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <Link href={`/library/${item.catalog_id}`} style={{ textDecoration: "none" }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: "#111827",
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
        <p style={{ fontSize: 13, color: "#2563eb", marginBottom: 8 }}>
          {item.authors.join(", ")}
        </p>
      )}

      {/* Abstract excerpt */}
      {item.description && (
        <p style={{
          fontSize: 13, color: "#374151", fontStyle: "italic",
          lineHeight: 1.6, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          &ldquo;{item.description}&rdquo;
        </p>
      )}

      {/* Footer: citations + views */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
          <Quote size={12} /> {citations} Citations
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
          <Eye size={12} /> {views.toLocaleString()} Views
        </span>
      </div>
    </div>
  );
}
