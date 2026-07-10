import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { FIXTURE_FILE } from "../global-setup";

const fixtures = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));

/**
 * SDD §7 E2E target TC-TXX-007 (browser-level): a guest can find and open a
 * public archive item, but a restricted item's content never reaches a
 * logged-out visitor's browser.
 */
test.describe("Archive visibility by access tier (guest, no auth) — TC-TXX-007", () => {
  test("a published public-tier item is discoverable via search", async ({ page }) => {
    await page.goto("/archive");

    await page.getByPlaceholder("Search by title, category, or keyword…").fill(fixtures.publicArchiveTitle);
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page.getByRole("link", { name: fixtures.publicArchiveTitle })).toBeVisible();
  });

  test("a restricted item's title/content is not exposed to a guest visiting it directly", async ({ page }) => {
    const response = await page.goto(`/archive/${fixtures.restrictedArchiveId}`);
    expect(response?.ok()).toBe(true); // Next.js still renders a page shell (client-side 403 handling)

    // The restricted document's actual title must never render for an unauthenticated guest.
    await expect(page.getByText(fixtures.restrictedArchiveTitle)).toHaveCount(0);
    // And no download link/PDF viewer should be present.
    await expect(page.getByRole("button", { name: /Download Document/i })).toHaveCount(0);
  });
});
