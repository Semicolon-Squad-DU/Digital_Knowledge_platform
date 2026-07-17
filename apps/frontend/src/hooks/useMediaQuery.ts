"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Always start false — matching what the server renders (no `window` there) —
  // so the client's first render is identical to the SSR'd HTML. A lazy
  // initializer that reads `window.matchMedia` immediately would make the
  // client's first paint diverge from the server's on a real phone/narrow
  // viewport (starts true instead of false), which React reports as a
  // hydration mismatch. useEffect below corrects it right after mount.
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
