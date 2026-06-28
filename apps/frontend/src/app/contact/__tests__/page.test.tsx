import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ContactPage from "../page";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

describe("ContactPage", () => {
  it("renders without crashing and shows the page heading and a submit control", () => {
    render(<ContactPage />);
    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });
});
