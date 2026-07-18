import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // NFR-016 (frontend half): SRS/SDD target ≥70% coverage; actual coverage
    // across the whole src tree is under 1% as of 2026-07-18 — only two
    // components have tests, out of a much larger app/ and components/ tree.
    // Threshold is set just below current numbers so CI actually gates
    // regressions instead of doing nothing (the previous state, matching
    // apps/backend/jest.config.js's NFR-016 fix) — raise these floors
    // incrementally as real coverage improves, working toward 70%.
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/app/**/layout.tsx",
        "src/app/tailwind.generated.css",
      ],
      thresholds: {
        statements: 0.5,
        branches: 0.4,
        functions: 0.4,
        lines: 0.5,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
