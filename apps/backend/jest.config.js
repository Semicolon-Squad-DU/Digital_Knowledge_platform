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
  // src tree is ~18.3% as of 2026-07-18, after adding Zod-validated route
  // handler tests for auth, library (wishlist/holds), archive (search/
  // download-url/status-transition), research (labs/create/update), and
  // showcase (create/review/update) — up from ~8.4% when only pure-logic
  // modules were covered. Threshold is set just below current numbers so CI
  // actually gates regressions — raise these floors incrementally as real
  // coverage improves, working toward 70%.
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
      statements: 18,
      branches: 12,
      functions: 16,
      lines: 18,
    },
  },
};
