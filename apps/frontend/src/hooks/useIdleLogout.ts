"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

// NFR-006: sessions must end after 30 minutes of user inactivity, independent
// of the refresh token's own 7-day lifetime — lib/api.ts silently renews the
// access token on any request, so without this a signed-in tab would never
// actually expire as long as background requests kept firing.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel",
];

export function useIdleLogout(enabled: boolean) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleIdle = () => {
      void logout();
      toast.error("You were signed out after 30 minutes of inactivity.");
      router.push("/login");
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    // Multiple tabs share the same session — if one tab goes idle while the
    // user is active in another, staying signed in there is correct. Any
    // activity in that other tab still writes to localStorage's auth state
    // (zustand persist), which fires a "storage" event here to reset the timer.
    const onStorage = (e: StorageEvent) => { if (e.key === "dkp-auth") resetTimer(); };
    window.addEventListener("storage", onStorage);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, logout, router]);
}
