import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without this, each render() within a file accumulates in the DOM instead of
// unmounting between tests — queries like getByText then fail with "multiple
// elements found" once a file has more than one test that renders the same
// component (only surfaced once tests actually started doing that).
afterEach(() => {
  cleanup();
});
