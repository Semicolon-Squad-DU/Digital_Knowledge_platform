/**
 * Modern Academic design system — Digital Knowledge Platform (DKP).
 * Source: Semicolon Website Redesign / Stitch brand tokens.
 */

export const C = {
  // Brand anchors
  ink: "#1A1A2E",           // university-blue / primary-container
  accent: "#0D47A1",        // institutional-accent
  slate: "#4B5563",         // slate-gray
  white: "#FFFFFF",         // canvas-white
  bg: "#f9f9ff",            // background / surface
  onBg: "#141b2b",          // on-background / on-surface
  body: "#555f6d",          // secondary
  muted: "#47464c",         // on-surface-variant
  outline: "#78767d",
  outlineVariant: "#c8c5cd",

  // Surfaces (tonal layers)
  surface: "#f9f9ff",
  surfaceDim: "#d3daef",
  surfaceBright: "#f9f9ff",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f1f3ff",    // chip
  surfaceMid: "#e9edff",
  surfaceHigh: "#e1e8fd",   // band
  surfaceHighest: "#dce2f7",
  sidebar: "#F8F9FA",       // tertiary gray containment

  // Semantic aliases used by existing redesigned pages
  band: "#e1e8fd",
  chip: "#f1f3ff",
  line: "rgba(75,85,99,0.16)",
  lineStrong: "rgba(75,85,99,0.22)",

  // Feedback
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",

  // Elevation
  shadow: "0 4px 24px rgba(26,26,46,0.05)",
  shadowHover: "0 8px 32px rgba(26,26,46,0.08)",
} as const;

export const SERIF = "var(--font-serif), 'Libre Caslon Text', Georgia, serif";
export const SANS = "var(--font-hanken), 'Hanken Grotesk', system-ui, sans-serif";

export const RADIUS = {
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
} as const;

export const SPACE = {
  base: 8,
  gutter: 24,
  marginMobile: 16,
  marginDesktop: 64,
  maxWidth: 1280,
} as const;

export const TYPE = {
  displayLg: { fontFamily: SERIF, fontSize: 48, fontWeight: 700, lineHeight: "56px" },
  displayLgMobile: { fontFamily: SERIF, fontSize: 32, fontWeight: 700, lineHeight: "40px" },
  headlineMd: { fontFamily: SERIF, fontSize: 32, fontWeight: 600, lineHeight: "40px" },
  headlineSm: { fontFamily: SERIF, fontSize: 24, fontWeight: 600, lineHeight: "32px" },
  bodyLg: { fontFamily: SANS, fontSize: 18, fontWeight: 400, lineHeight: "28px" },
  bodyMd: { fontFamily: SANS, fontSize: 16, fontWeight: 400, lineHeight: "24px" },
  labelMd: { fontFamily: SANS, fontSize: 14, fontWeight: 600, lineHeight: "20px", letterSpacing: "0.05em" },
  labelSm: { fontFamily: SANS, fontSize: 12, fontWeight: 500, lineHeight: "16px" },
} as const;

export const NAV_LINKS = [
  { label: "Archive", href: "/archive" },
  { label: "Library", href: "/library" },
  { label: "Research", href: "/research" },
  { label: "Showcase", href: "/showcase" },
] as const;

export const FOOTER_LINKS = [
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "About", href: "/about" },
] as const;

/** Shared page content padding matching Modern Academic margins. */
export const pagePad: React.CSSProperties = {
  maxWidth: SPACE.maxWidth,
  margin: "0 auto",
  padding: `clamp(32px, 5vw, 64px) clamp(${SPACE.marginMobile}px, 4vw, ${SPACE.marginDesktop}px)`,
};

export const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  fontSize: 16,
  fontFamily: SANS,
  color: C.onBg,
  background: C.white,
  border: `1px solid ${hasError ? C.error : C.lineStrong}`,
  borderRadius: RADIUS.DEFAULT,
  outline: "none",
});

export const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 22px",
  background: C.ink,
  color: C.white,
  border: "none",
  borderRadius: RADIUS.md,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: SANS,
  letterSpacing: "0.02em",
  cursor: "pointer",
  textDecoration: "none",
};

export const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: C.ink,
  border: `1.5px solid ${C.ink}`,
};

export const cardStyle: React.CSSProperties = {
  background: C.white,
  border: `1px solid ${C.lineStrong}`,
  borderRadius: RADIUS.lg,
  boxShadow: C.shadow,
};

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
      return { label: "Restricted", bg: C.errorContainer, color: "#93000a", border: "#fecaca" };
    default:
      return { label: tier || "Access", bg: C.surfaceLow, color: C.slate, border: C.outlineVariant };
  }
}
