"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Heart, Search } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";

interface DashboardHeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function DashboardHeader({
  title = "Dashboard",
  showSearch = true,
  searchPlaceholder = "Search knowledge base...",
  onSearch,
}: DashboardHeaderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { data: notifData } = useNotifications(1, false, isAuthenticated);
  const [searchInput, setSearchInput] = useState("");
  const unreadCount = notifData?.unread_count ?? 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput);
  };

  return (
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
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Title */}
      {title && !showSearch && (
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
          {title}
        </h1>
      )}

      {/* Search */}
      {showSearch && (
        <form
          onSubmit={handleSearchSubmit}
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
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 13,
              color: "#6b7280",
              width: "100%",
              outline: "none",
            }}
          />
        </form>
      )}

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
          <Heart size={18} color="#6b7280" />
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
          {user?.name?.[0]?.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
