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
  // src tree is ~7% as of 2026-07-18 (unit tests only cover a handful of
  // pure-logic modules — routes, jobs, and infrastructure are largely
  // untested). Threshold is set just below current numbers so CI actually
  // gates regressions instead of doing nothing (the previous state) — raise
  // these floors incrementally as real coverage improves, working toward 70%.
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
      statements: 6,
      branches: 5,
      functions: 4,
      lines: 6,
    },
  },
};
