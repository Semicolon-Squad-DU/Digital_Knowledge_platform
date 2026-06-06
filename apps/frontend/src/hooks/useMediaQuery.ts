"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect media query matches
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side only)
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(query);
    
    // Set initial state
    setMatches(mediaQueryList.matches);

    // Create listener callback
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    mediaQueryList.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
