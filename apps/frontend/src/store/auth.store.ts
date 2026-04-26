import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@dkp/shared";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  updateProfile: (data: { name?: string; bio?: string; department?: string; avatar_url?: string }) => Promise<User>;
  changePassword: (current_password: string, new_password: string, confirm_password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

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

      updateProfile: async (data) => {
        try {
          const { data: response } = await api.patch("/auth/profile", data);
          const updatedUser = response.data;
          set({ user: updatedUser });
          return updatedUser;
        } catch (err) {
          throw err;
        }
      },

      changePassword: async (current_password, new_password, confirm_password) => {
        try {
          await api.patch("/auth/password", {
            current_password,
            new_password,
            confirm_password,
          });
          // Password changed successfully, optionally refresh user data
          const { data } = await api.get("/auth/me");
          set({ user: data.data });
        } catch (err) {
          throw err;
        }
      },
    }),
    {
      name: "dkp-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
