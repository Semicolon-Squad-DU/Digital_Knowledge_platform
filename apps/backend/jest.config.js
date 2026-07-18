/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "\\.integration\\.test\\.ts$"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@dkp/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  clearMocks: true,
  // NFR-016: SRS/SDD target ≥70% coverage; actual coverage across the whole
  // src tree is ~15.5% as of 2026-07-18, after adding mocked-pool route
  // handler tests for auth.routes/login/register/refresh/me, library
  // wishlist+holds, and archive search/download-url/status-transition (up
  // from ~8.4% when only pure-logic modules — file-signature, pagination,
  // the auth domain-allowlist gate, csv, isbn, fine-calculator — were
  // covered). Threshold is set just below current numbers so CI actually
  // gates regressions — raise these floors incrementally as real coverage
  // improves, working toward 70%.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.ts",
    "!src/**/*.integration.test.ts",
    "!src/core/db/migrations/**",
    "!src/core/db/seed.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 15,
      branches: 11,
      functions: 14,
      lines: 15,
    },
  },
};
