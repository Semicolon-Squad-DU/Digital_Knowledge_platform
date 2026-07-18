import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // NFR-016 (frontend half): SRS/SDD target ≥70% coverage; actual coverage
    // across the whole src tree is ~5.5% as of 2026-07-18 after adding auth
    // store/interceptor/login/register/events/library tests (up from <1%
    // with only two components tested). Threshold is set just below current
    // numbers so CI actually gates regressions — raise these floors
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
        statements: 5,
        branches: 4,
        functions: 3,
        lines: 5,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
