import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@dkp/shared";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  /** Synchronously drops the store back to guest state — no network call. Used
   *  when lib/api.ts already knows the session is dead (token refresh failed). */
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          const { access_token, refresh_token, user } = data.data;
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          const refresh_token = localStorage.getItem("refresh_token");
          await api.post("/auth/logout", { refresh_token });
        } catch {
          // ignore
        } finally {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearSession: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "dkp-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Called once rehydration from localStorage is complete
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // The persisted isAuthenticated flag reflects the session as of the last
        // page close — it says nothing about whether the refresh token is still
        // valid server-side. Revalidate immediately so an expired/revoked session
        // drops to guest state instead of rendering as logged-in with dead tokens.
        if (state?.isAuthenticated) {
          void state.fetchMe();
        }
      },
    }
  )
);
