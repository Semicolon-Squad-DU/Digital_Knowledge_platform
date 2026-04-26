/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // GitHub-style palette
        gh: {
          // Canvas
          "canvas-default":  "#ffffff",
          "canvas-subtle":   "#f6f8fa",
          "canvas-inset":    "#f6f8fa",
          // Border
          "border-default":  "#d0d7de",
          "border-muted":    "#d8dee4",
          // Foreground
          "fg-default":      "#1f2328",
          "fg-muted":        "#636c76",
          "fg-subtle":       "#6e7781",
          "fg-on-emphasis":  "#ffffff",
          // Accent (blue)
          "accent-fg":       "#0969da",
          "accent-emphasis": "#0969da",
          "accent-muted":    "rgba(84,174,255,0.4)",
          "accent-subtle":   "#ddf4ff",
          // Success (green)
          "success-fg":      "#1a7f37",
          "success-emphasis":"#1f883d",
          "success-subtle":  "#dafbe1",
          // Attention (yellow)
          "attention-fg":    "#9a6700",
          "attention-subtle":"#fff8c5",
          // Danger (red)
          "danger-fg":       "#d1242f",
          "danger-emphasis": "#cf222e",
          "danger-subtle":   "#ffebe9",
          // Neutral
          "neutral-emphasis":"#6e7781",
          "neutral-subtle":  "#f6f8fa",
          // Done (purple)
          "done-fg":         "#8250df",
          "done-subtle":     "#fbefff",
          // Sponsors (pink)
          "sponsors-fg":     "#bf3989",
        },
        // Dark mode overrides
        "gh-dark": {
          "canvas-default":  "#0d1117",
          "canvas-subtle":   "#161b22",
          "canvas-inset":    "#010409",
          "border-default":  "#30363d",
          "border-muted":    "#21262d",
          "fg-default":      "#e6edf3",
          "fg-muted":        "#8b949e",
          "fg-subtle":       "#6e7681",
          "accent-fg":       "#58a6ff",
          "accent-subtle":   "rgba(56,139,253,0.15)",
          "success-fg":      "#3fb950",
          "success-subtle":  "rgba(46,160,67,0.15)",
          "attention-fg":    "#d29922",
          "attention-subtle":"rgba(187,128,9,0.15)",
          "danger-fg":       "#f85149",
          "danger-subtle":   "rgba(248,81,73,0.15)",
          "done-fg":         "#a371f7",
          "done-subtle":     "rgba(163,113,247,0.15)",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "\"Segoe UI\"", "\"Noto Sans\"", "Helvetica", "Arial", "sans-serif", "\"Apple Color Emoji\"", "\"Segoe UI Emoji\""],
        mono: ["ui-monospace", "SFMono-Regular", "\"SF Mono\"", "Menlo", "Consolas", "\"Liberation Mono\"", "monospace"],
      },
      fontSize: {
        "gh-xs":   ["11px", { lineHeight: "16px" }],
        "gh-sm":   ["12px", { lineHeight: "20px" }],
        "gh-base": ["14px", { lineHeight: "21px" }],
        "gh-lg":   ["16px", { lineHeight: "24px" }],
        "gh-xl":   ["20px", { lineHeight: "30px" }],
        "gh-2xl":  ["24px", { lineHeight: "32px" }],
        "gh-3xl":  ["32px", { lineHeight: "40px" }],
      },
      borderRadius: {
        "gh": "6px",
        "gh-lg": "12px",
      },
      boxShadow: {
        "gh-sm":     "0 1px 0 rgba(31,35,40,0.04)",
        "gh":        "0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)",
        "gh-md":     "0 3px 6px rgba(140,149,159,0.15)",
        "gh-lg":     "0 8px 24px rgba(140,149,159,0.2)",
        "gh-xl":     "0 12px 28px rgba(140,149,159,0.3)",
        "gh-inset":  "inset 0 1px 0 rgba(255,255,255,0.25)",
        "gh-btn":    "0 1px 0 rgba(31,35,40,0.1), inset 0 1px 0 rgba(255,255,255,0.03)",
        "gh-btn-primary": "0 1px 0 rgba(31,35,40,0.1)",
        // Dark
        "gh-dark":   "0 1px 3px rgba(1,4,9,0.8), 0 8px 24px rgba(1,4,9,0.4)",
        "gh-dark-md":"0 3px 6px rgba(1,4,9,0.4)",
      },
      backgroundImage: {
        "gradient-bg":      "var(--gradient-bg)",
        "gradient-surface": "var(--gradient-surface)",
        "gradient-header":  "var(--gradient-header)",
        "gradient-accent":  "var(--gradient-accent)",
        "gradient-success": "var(--gradient-success)",
        "gradient-danger":  "var(--gradient-danger)",
        "gradient-hero":    "var(--gradient-hero)",
      },
      animation: {
        "fade-in":    "fadeIn 0.15s ease-out",
        "slide-down": "slideDown 0.15s ease-out",
        "scale-in":   "scaleIn 0.1s ease-out",
        "shimmer":    "shimmer 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" },                              to: { opacity: "1" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn:   { from: { opacity: "0", transform: "scale(0.97)" },    to: { opacity: "1", transform: "scale(1)" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
