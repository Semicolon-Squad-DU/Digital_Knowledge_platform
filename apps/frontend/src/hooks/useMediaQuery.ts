"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Lazy initialiser: on client-side navigations `window` is already
  // available, so we get the correct value synchronously — no flash.
  // On SSR `window` is undefined so we fall back to false.
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    // Sync in case the lazy value was wrong (e.g. first SSR paint)
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
