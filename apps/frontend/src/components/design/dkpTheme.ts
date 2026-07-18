/** Shared institutional redesign tokens (Stitch "Semicolon Website Redesign"). */
export const C = {
  ink: "#1A1A2E",
  accent: "#0D47A1",
  bg: "#f9f9ff",
  band: "#e1e8fd",
  chip: "#f1f3ff",
  white: "#ffffff",
  body: "#555f6d",
  line: "rgba(75,85,99,0.16)",
  lineStrong: "rgba(75,85,99,0.22)",
  sidebar: "#F8F9FA",
} as const;

export const SERIF = "var(--font-serif), 'Libre Caslon Text', Georgia, serif";
export const SANS = "var(--font-hanken), 'Hanken Grotesk', system-ui, sans-serif";

export const NAV_LINKS = [
  { label: "Archive", href: "/archive" },
  { label: "Library", href: "/library" },
  { label: "Research", href: "/research" },
  { label: "Showcase", href: "/showcase" },
] as const;

export type AccessVisual = {
  label: string;
  bg: string;
  color: string;
  border: string;
};

export function accessVisual(tier?: string | null): AccessVisual {
  switch (tier) {
    case "public":
      return { label: "Open Access", bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
    case "member":
    case "staff":
      return { label: "Institutional Login", bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
    case "restricted":
      return { label: "Restricted", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
    default:
      return { label: tier || "Access", bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
  }
}
