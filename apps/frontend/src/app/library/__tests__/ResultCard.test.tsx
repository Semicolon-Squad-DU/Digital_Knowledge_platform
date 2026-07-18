import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResultCard } from "../ResultCard";
import toast from "react-hot-toast";

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

describe("ResultCard wishlist button", () => {
  it("blocks an unauthenticated user with a toast and does not call onWishlist", () => {
    const onWishlist = vi.fn();
    render(
      <ResultCard item={baseItem} isLibrarian={false} isAuthenticated={false} onWishlist={onWishlist} />
    );
    fireEvent.click(screen.getByTitle("Add to wishlist"));
    expect(toast.error).toHaveBeenCalledWith("Sign in to add to wishlist");
    expect(onWishlist).not.toHaveBeenCalled();
  });

  it("calls onWishlist and flips to the wishlisted state for an authenticated user", () => {
    const onWishlist = vi.fn();
    render(
      <ResultCard item={baseItem} isLibrarian={false} isAuthenticated={true} onWishlist={onWishlist} />
    );
    fireEvent.click(screen.getByTitle("Add to wishlist"));
    expect(onWishlist).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle("Added to wishlist")).toBeInTheDocument();
  });
});

describe("ResultCard delete button", () => {
  it("shows the delete button for a librarian with an onDelete handler, and calls it on click", () => {
    const onDelete = vi.fn();
    render(
      <ResultCard item={baseItem} isLibrarian={true} isAuthenticated={true} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByTitle("Remove from catalog"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render the delete button for a non-librarian even with an onDelete handler", () => {
    render(
      <ResultCard item={baseItem} isLibrarian={false} isAuthenticated={true} onDelete={vi.fn()} />
    );
    expect(screen.queryByTitle("Remove from catalog")).not.toBeInTheDocument();
  });
});

describe("ResultCard access badge", () => {
  it("shows RESTRICTED when there are zero available copies, regardless of the item's access tier", () => {
    render(
      <ResultCard item={{ ...baseItem, available_copies: 0, access_tier: "public" }} isLibrarian={false} isAuthenticated={false} />
    );
    expect(screen.getByText("RESTRICTED")).toBeInTheDocument();
  });

  it("shows OPEN ACCESS for a public item with copies available", () => {
    render(
      <ResultCard item={{ ...baseItem, access_tier: "public" }} isLibrarian={false} isAuthenticated={false} />
    );
    expect(screen.getByText("OPEN ACCESS")).toBeInTheDocument();
  });
});
