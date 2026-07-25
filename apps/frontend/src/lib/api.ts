import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/** Every backend error responds `{ success: false, message }` (see
 * error.middleware.ts) — pull that through instead of a hardcoded string so
 * things like rate-limit 429s are distinguishable from a generic failure. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.code === "ERR_NETWORK") return "Can't reach the server. Check your connection and try again.";
  }
  return fallback;
}

// Attach JWT from localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

// The backend rotates refresh tokens on every use — one refresh deletes the
// token that was just spent. `isRefreshing`/`failedQueue` only dedupe
// concurrent 401s within *this* tab's JS module instance. With multiple tabs
// open on the same session (or a background poll like useNotifications
// racing a user action), two tabs can both read the same refresh_token from
// localStorage and both call /auth/refresh: the first rotates it, the second
// then gets rejected as "revoked" and — without this lock — would wipe
// localStorage and force-logout every tab, even the one that just succeeded.
// This lock makes the losing tab wait for the winning tab's new token
// (delivered via the "storage" event, which — per spec — only fires in
// *other* tabs, not the one that wrote the value) instead of racing it.
const REFRESH_LOCK_KEY = "dkp_refresh_lock";
const REFRESH_LOCK_TTL_MS = 10_000;

function acquireCrossTabRefreshLock(): boolean {
  const now = Date.now();
  const existing = Number(localStorage.getItem(REFRESH_LOCK_KEY) || 0);
  if (existing && now - existing < REFRESH_LOCK_TTL_MS) return false;
  localStorage.setItem(REFRESH_LOCK_KEY, String(now));
  return true;
}

function releaseCrossTabRefreshLock() {
  localStorage.removeItem(REFRESH_LOCK_KEY);
}

function waitForTokenFromOtherTab(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("storage", onStorage);
      reject(new Error("Timed out waiting for another tab to refresh the session"));
    }, REFRESH_LOCK_TTL_MS + 2000);

    function onStorage(e: StorageEvent) {
      if (e.key === "access_token" && e.newValue) {
        clearTimeout(timeout);
        window.removeEventListener("storage", onStorage);
        resolve(e.newValue);
      } else if (e.key === REFRESH_LOCK_KEY && e.newValue === null) {
        // Other tab released the lock — if it didn't leave a token behind,
        // its refresh attempt failed too, so there's nothing to piggyback on.
        clearTimeout(timeout);
        window.removeEventListener("storage", onStorage);
        const token = localStorage.getItem("access_token");
        if (token) resolve(token);
        else reject(new Error("Token refresh failed in another tab"));
      }
    }
    window.addEventListener("storage", onStorage);
  });
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      let holdsLock = acquireCrossTabRefreshLock();
      if (!holdsLock) {
        try {
          const token = await waitForTokenFromOtherTab();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          // The other tab's refresh didn't pan out — fall through and try
          // our own, but only release the lock below if we actually re-took it
          // (a third tab may hold it by now).
          holdsLock = acquireCrossTabRefreshLock();
        }
      }

      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        if (holdsLock) releaseCrossTabRefreshLock();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        useAuthStore.getState().clearSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token: newRefresh } = data.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        if (holdsLock) releaseCrossTabRefreshLock();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
