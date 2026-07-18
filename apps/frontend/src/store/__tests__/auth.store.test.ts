import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../auth.store";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

const mockedApi = api as unknown as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: false,
  });
}

describe("auth.store", () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("stores tokens and sets the user as authenticated on success", async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { data: { access_token: "at", refresh_token: "rt", user: { id: "u1", role: "member" } } },
      });

      await useAuthStore.getState().login("a@b.com", "pw");

      expect(localStorage.getItem("access_token")).toBe("at");
      expect(localStorage.getItem("refresh_token")).toBe("rt");
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({ id: "u1", role: "member" });
      expect(state.isLoading).toBe(false);
    });

    it("resets isLoading and rethrows on failure, without setting a user", async () => {
      mockedApi.post.mockRejectedValueOnce(new Error("bad credentials"));

      await expect(useAuthStore.getState().login("a@b.com", "wrong")).rejects.toThrow("bad credentials");

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears tokens and resets state even when the server call succeeds", async () => {
      localStorage.setItem("access_token", "at");
      localStorage.setItem("refresh_token", "rt");
      useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      await useAuthStore.getState().logout();

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("still clears local session state when the server logout call fails", async () => {
      localStorage.setItem("access_token", "at");
      localStorage.setItem("refresh_token", "rt");
      useAuthStore.setState({ user: { id: "u1" } as any, isAuthenticated: true });
      mockedApi.post.mockRejectedValueOnce(new Error("network error"));

      await useAuthStore.getState().logout();

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("fetchMe", () => {
    it("sets user and isAuthenticated on a successful fetch", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: { id: "u2", role: "admin" } } });

      await useAuthStore.getState().fetchMe();

      expect(useAuthStore.getState().user).toEqual({ id: "u2", role: "admin" });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("drops to guest state when the fetch fails, e.g. an expired session", async () => {
      useAuthStore.setState({ user: { id: "stale" } as any, isAuthenticated: true });
      mockedApi.get.mockRejectedValueOnce(new Error("401"));

      await useAuthStore.getState().fetchMe();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("setUser / clearSession", () => {
    it("setUser marks the store authenticated with the given user", () => {
      useAuthStore.getState().setUser({ id: "u3" } as any);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual({ id: "u3" });
    });

    it("clearSession synchronously drops to guest state without any network call", () => {
      useAuthStore.setState({ user: { id: "u3" } as any, isAuthenticated: true });
      useAuthStore.getState().clearSession();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockedApi.get).not.toHaveBeenCalled();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });
});
