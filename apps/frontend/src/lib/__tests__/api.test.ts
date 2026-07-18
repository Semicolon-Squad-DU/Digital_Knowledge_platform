import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("@/store/auth.store", () => ({
  useAuthStore: { getState: vi.fn(() => ({ clearSession: vi.fn() })) },
}));

describe("api request interceptor", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("attaches the Authorization header when an access token is present", async () => {
    localStorage.setItem("access_token", "my-token");
    const { default: api } = await import("../api");
    const config = await api.interceptors.request.handlers[0].fulfilled({ headers: {} } as any);
    expect(config.headers.Authorization).toBe("Bearer my-token");
  });

  it("does not attach an Authorization header when there is no token", async () => {
    const { default: api } = await import("../api");
    const config = await api.interceptors.request.handlers[0].fulfilled({ headers: {} } as any);
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe("api response interceptor — 401 refresh flow", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("passes through a 401 from the login endpoint itself without attempting a refresh", async () => {
    const { default: api } = await import("../api");
    const postSpy = vi.spyOn(axios, "post");

    const error = {
      response: { status: 401 },
      config: { url: "/auth/login", headers: {} },
    };

    await expect(
      api.interceptors.response.handlers[0].rejected(error)
    ).rejects.toBe(error);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("refreshes the token and retries the original request on a 401 from a non-auth endpoint", async () => {
    localStorage.setItem("refresh_token", "old-refresh");
    const { default: api } = await import("../api");

    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { data: { access_token: "new-access", refresh_token: "new-refresh" } },
    });
    // The retry re-enters the api instance as a callable (api(config)), which
    // internally resolves via its configured adapter — stub that directly
    // rather than spying on api.request, since the callable instance is a
    // distinct bound function from the `request` property.
    const adapterSpy = vi.fn().mockResolvedValue({ data: "retried", status: 200, headers: {}, config: {} });
    api.defaults.adapter = adapterSpy;

    const originalRequest: any = { url: "/library/catalog", headers: {} };
    const error: any = { response: { status: 401 }, config: originalRequest };

    const result = await api.interceptors.response.handlers[0].rejected(error);

    expect(localStorage.getItem("access_token")).toBe("new-access");
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh");
    expect(originalRequest.headers.Authorization).toBe("Bearer new-access");
    expect(originalRequest._retry).toBe(true);
    expect(adapterSpy).toHaveBeenCalled();
    expect((result as any).data).toBe("retried");
  });

  it("clears the session and rejects when there is no refresh token to use", async () => {
    const { default: api } = await import("../api");
    const postSpy = vi.spyOn(axios, "post");

    const originalRequest: any = { url: "/library/catalog", headers: {} };
    const error: any = { response: { status: 401 }, config: originalRequest };

    await expect(
      api.interceptors.response.handlers[0].rejected(error)
    ).rejects.toBe(error);
    expect(postSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("clears tokens and rejects when the refresh call itself fails", async () => {
    localStorage.setItem("access_token", "stale-access");
    localStorage.setItem("refresh_token", "dead-refresh");
    const { default: api } = await import("../api");

    const refreshError = new Error("refresh failed");
    vi.spyOn(axios, "post").mockRejectedValueOnce(refreshError);

    const originalRequest: any = { url: "/library/catalog", headers: {} };
    const error: any = { response: { status: 401 }, config: originalRequest };

    await expect(
      api.interceptors.response.handlers[0].rejected(error)
    ).rejects.toBe(refreshError);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("passes through non-401 errors untouched", async () => {
    const { default: api } = await import("../api");
    const error: any = { response: { status: 500 }, config: { url: "/library/catalog", headers: {} } };

    await expect(
      api.interceptors.response.handlers[0].rejected(error)
    ).rejects.toBe(error);
  });
});
