/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.integration.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@dkp/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  setupFiles: ["<rootDir>/jest.integration.setup.js"],
  testTimeout: 15000,
};
