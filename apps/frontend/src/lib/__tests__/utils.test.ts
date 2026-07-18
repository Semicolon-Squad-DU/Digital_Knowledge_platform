import { describe, it, expect } from "vitest";
import {
  isPasswordStrong,
  formatDate,
  formatDateTime,
  timeAgo,
  formatFileSize,
  truncate,
  getAccessTierBadge,
  getStatusBadge,
} from "../utils";

describe("isPasswordStrong", () => {
  // Mirrors the backend's composed validator (auth.routes.ts: isLength({min:8})
  // + .matches(PASSWORD_STRENGTH_REGEX)) — same net rule, just combined into one
  // regex here instead of two chained checks. Keep both sides honest.
  it("accepts a password with upper, lower, digit, special char, and 8+ length", () => {
    expect(isPasswordStrong("Passw0rd!")).toBe(true);
  });

  it("rejects a password under 8 characters even if all character classes are present", () => {
    expect(isPasswordStrong("Pw0!")).toBe(false);
  });

  it("rejects a password missing an uppercase letter", () => {
    expect(isPasswordStrong("passw0rd!")).toBe(false);
  });

  it("rejects a password missing a lowercase letter", () => {
    expect(isPasswordStrong("PASSW0RD!")).toBe(false);
  });

  it("rejects a password missing a digit", () => {
    expect(isPasswordStrong("Password!")).toBe(false);
  });

  it("rejects a password missing a special character", () => {
    expect(isPasswordStrong("Password0")).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(isPasswordStrong("")).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("formats bytes under 1KB as whole bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes to one decimal place", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes to one decimal place", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("formats gigabytes to one decimal place", () => {
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });

  it("treats exactly 0 bytes as bytes, not a divide-by-zero artifact", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis when over the limit", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("does not truncate a string exactly at the limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("date helpers — null/invalid safety", () => {
  it("formatDate returns 'n/a' for null/undefined/invalid input instead of throwing or printing 'Invalid Date'", () => {
    expect(formatDate(null)).toBe("n/a");
    expect(formatDate(undefined)).toBe("n/a");
    expect(formatDate("not-a-date")).toBe("n/a");
  });

  it("formatDateTime returns 'n/a' for null/undefined/invalid input", () => {
    expect(formatDateTime(null)).toBe("n/a");
    expect(formatDateTime("not-a-date")).toBe("n/a");
  });

  it("timeAgo returns 'n/a' for null/undefined/invalid input", () => {
    expect(timeAgo(null)).toBe("n/a");
    expect(timeAgo("not-a-date")).toBe("n/a");
  });

  it("formatDate renders a real date correctly", () => {
    expect(formatDate("2026-03-05T00:00:00Z")).toMatch(/Mar 5, 2026|Mar 4, 2026/);
  });
});

describe("getAccessTierBadge", () => {
  it("returns the known label/color for each of the four real tiers", () => {
    expect(getAccessTierBadge("public").label).toBe("Public");
    expect(getAccessTierBadge("member").label).toBe("Members");
    expect(getAccessTierBadge("staff").label).toBe("Staff");
    expect(getAccessTierBadge("restricted").label).toBe("Restricted");
  });

  it("falls back to the raw value instead of crashing on an unknown tier", () => {
    const badge = getAccessTierBadge("some_future_tier");
    expect(badge.label).toBe("some_future_tier");
    expect(badge.color).toContain("surface-container-high");
  });
});

describe("getStatusBadge", () => {
  it("returns the known label for each documented status", () => {
    expect(getStatusBadge("published").label).toBe("Published");
    expect(getStatusBadge("overdue").label).toBe("Overdue");
  });

  it("falls back to the raw value instead of crashing on an unknown status", () => {
    const badge = getStatusBadge("some_future_status");
    expect(badge.label).toBe("some_future_status");
  });
});
