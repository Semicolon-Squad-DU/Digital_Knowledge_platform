import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResultCard } from "../ResultCard";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const baseItem = {
  catalog_id: "a1b2c3",
  title: "Introduction to Algorithms",
  authors: ["Cormen", "Leiserson"],
  available_copies: 3,
  total_copies: 5,
  created_at: "2025-01-01T00:00:00Z",
};

describe("ResultCard view count", () => {
  it("renders the real view_count from the API, not a fabricated number", () => {
    render(
      <ResultCard
        item={{ ...baseItem, view_count: 1234 }}
        isLibrarian={false}
        isAuthenticated={false}
      />
    );
    expect(screen.getByText("1,234 Views")).toBeInTheDocument();
  });

  it("shows 0 views for an item with no recorded views, instead of inventing a number", () => {
    render(
      <ResultCard
        item={{ ...baseItem, view_count: undefined }}
        isLibrarian={false}
        isAuthenticated={false}
      />
    );
    expect(screen.getByText("0 Views")).toBeInTheDocument();

    // Regression guard: the old formula was
    // available_copies * 47 + catalog_id.charCodeAt(0) * 13.
    // For this item that would be 3*47 + 97*13 = 1402 — must not appear.
    expect(screen.queryByText("1,402 Views")).not.toBeInTheDocument();
  });
});
