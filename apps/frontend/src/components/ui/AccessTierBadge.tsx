const TIER_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  public:      { label: "PUBLIC",     bg: "#111827", color: "#fff" },
  member:      { label: "MEMBERS",    bg: "#1e3a5f", color: "#fff" },
  staff:       { label: "STAFF",      bg: "#4338ca", color: "#fff" },
  restricted:  { label: "RESTRICTED", bg: "#7f1d1d", color: "#fff" },
};

// Who's allowed to view/download an item — same chip used in Library and
// Archive so "public"/"restricted" etc. read the same across both sections.
export function AccessTierBadge({ tier }: { tier?: string }) {
  const s = TIER_STYLES[tier ?? "public"] ?? TIER_STYLES.public;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 6,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}
