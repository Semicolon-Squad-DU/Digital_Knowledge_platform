import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/script", () => ({
  default: () => null,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

const loginMock = vi.fn();
const useAuthStoreState = { user: null as { role: string } | null };
vi.mock("@/store/auth.store", () => ({
  useAuthStore: Object.assign(
    () => ({ login: loginMock, setUser: vi.fn() }),
    { getState: () => useAuthStoreState }
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    loginMock.mockReset();
    useAuthStoreState.user = null;
  });

  it("shows a validation error when submitting an invalid email", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Valid email required")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("logs in and redirects to /dashboard for a member on success", async () => {
    loginMock.mockResolvedValueOnce(undefined);
    useAuthStoreState.user = { role: "member" };

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Passw0rd!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("user@example.com", "Passw0rd!"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects an admin to /admin instead of /dashboard on success", async () => {
    loginMock.mockResolvedValueOnce(undefined);
    useAuthStoreState.user = { role: "admin" };

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Passw0rd!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  });

  it("shows the server error message when login fails", async () => {
    loginMock.mockRejectedValueOnce({ response: { data: { message: "Invalid email or password" } } });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
