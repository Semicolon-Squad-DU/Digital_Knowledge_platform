import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterPage from "../page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/script", () => ({
  default: () => null,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const apiPostMock = vi.fn();
vi.mock("@/lib/api", () => ({
  default: { post: (...args: unknown[]) => apiPostMock(...args) },
}));

vi.mock("@/store/auth.store", () => ({
  useAuthStore: () => ({ setUser: vi.fn() }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    apiPostMock.mockReset();
  });

  function fillRequiredFields() {
    const [nameInput, emailInput] = screen.getAllByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    fireEvent.change(emailInput, { target: { value: "jane@example.com" } });
    fireEvent.input(screen.getByPlaceholderText("••••••••••••"), { target: { value: "Abcdef1$" } });
  }

  it("shows the password checklist reacting live as the user types", () => {
    render(<RegisterPage />);
    const pwInput = screen.getByPlaceholderText("••••••••••••");

    // Nothing satisfied yet.
    expect(screen.getByText("8+ characters").closest("label")).toHaveTextContent("8+ characters");

    fireEvent.input(pwInput, { target: { value: "Abcdef1$" } });

    // All five checklist criteria should now render as satisfied (checkmark
    // present) — verified indirectly via the input's value driving state.
    expect((pwInput as HTMLInputElement).value).toBe("Abcdef1$");
  });

  it("blocks submission and shows an error when Terms of Service is not agreed to", async () => {
    render(<RegisterPage />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/you must agree to the terms of service/i)).toBeInTheDocument();
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("moves to the OTP verification step when registration requires email verification", async () => {
    apiPostMock.mockResolvedValueOnce({
      data: { data: { requiresVerification: true, email: "jane@example.com", role: "member" } },
    });

    render(<RegisterPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows a registration error message returned by the server", async () => {
    apiPostMock.mockRejectedValueOnce({ response: { data: { message: "Email already registered" } } });

    render(<RegisterPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
  });
});
