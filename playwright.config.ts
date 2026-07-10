import { defineConfig, devices } from "@playwright/test";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dkp_test_user:dkp_test_password@localhost:5433/dkp_test";

/**
 * Real browser-driven E2E — Chromium, hitting the real Next.js dev server and
 * real Express API, against the disposable test database (never the shared
 * Supabase dev DB). Complements the API-level integration tests in
 * apps/backend/src/**\/__tests__/*.integration.test.ts, which cover the same
 * SDD §7 test cases at the HTTP layer; these specs verify the actual UI.
 */
export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false, // specs share seeded fixture data
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: [
    {
      command: "npm run dev --workspace=apps/backend",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: TEST_DATABASE_URL,
        JWT_SECRET: "e2e-test-jwt-secret",
        NODE_ENV: "test",
        // Point at a closed port so ES stays "unavailable" and search falls back
        // to Postgres — fixture rows are seeded straight into Postgres and were
        // never indexed into the shared dev Elasticsearch, so a real ES query
        // would just find nothing.
        ELASTICSEARCH_URL: "http://localhost:1",
      },
    },
    {
      command: "npm run dev --workspace=apps/frontend",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
