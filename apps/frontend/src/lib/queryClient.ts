import { QueryClient } from "@tanstack/react-query";

// The QueryClient instance itself is created inside Providers (via useState,
// so each SSR request/browser tab gets its own — never a module-level
// singleton, which would leak data across concurrent users server-side).
// auth.store.ts is a plain module (no React hooks), but it still needs to
// clear cached query results whenever the signed-in identity changes —
// otherwise a page cached while viewing as one user (e.g. an archivist
// viewing a restricted document) keeps serving that stale response after
// switching to a different, less-privileged account in the same tab, since
// react-query's cache has no idea "who" a queryKey's data belongs to.
// This ref just lets the store reach the one QueryClient this tab has.
let queryClientRef: QueryClient | null = null;

export function setQueryClientRef(client: QueryClient) {
  queryClientRef = client;
}

export function clearQueryCache() {
  queryClientRef?.clear();
}
