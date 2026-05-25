import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/**
 * Waits for Zustand persist rehydration before checking auth.
 * Without this, a reload kicks the user out because isAuthenticated
 * starts as false before localStorage is read.
 *
 * Usage:
 *   const { user, ready } = useAuthGuard();
 *   if (!ready) return null;   // still hydrating — render nothing
 */
export function useAuthGuard(redirectTo = "/login") {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated     = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    // Only redirect AFTER hydration is confirmed
    if (hasHydrated && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const target = currentPath !== redirectTo
        ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        : redirectTo;
      router.replace(target);
    }
  }, [hasHydrated, isAuthenticated, router, redirectTo]);

  return {
    user,
    isAuthenticated,
    /** true once localStorage has been read — safe to render protected content */
    ready: hasHydrated && isAuthenticated,
  };
}
