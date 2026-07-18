import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Node's own experimental global `localStorage` (active by default on modern
// Node without a --localstorage-file) shadows jsdom's real, working
// implementation and throws "storage.setItem is not a function". Replace it
// with a minimal in-memory Storage so tests can use localStorage normally.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
}
Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

// Without this, each render() within a file accumulates in the DOM instead of
// unmounting between tests — queries like getByText then fail with "multiple
// elements found" once a file has more than one test that renders the same
// component (only surfaced once tests actually started doing that).
afterEach(() => {
  cleanup();
});
