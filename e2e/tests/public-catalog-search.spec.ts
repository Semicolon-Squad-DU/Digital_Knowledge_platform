import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { FIXTURE_FILE } from "../global-setup";

const fixtures = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));

/**
 * SDD §7 E2E target TC-TXX-012: a public visitor (no login) searches the
 * catalog, sees availability, and cannot actually borrow without an account.
 */
test.describe("Public catalog search (guest, no auth) — TC-TXX-012", () => {
  test("finds a published book and shows availability without logging in", async ({ page }) => {
    await page.goto("/library");

    await page.getByPlaceholder("Search by title, author, or ISBN…").fill(fixtures.publicBookTitle);
    await page.getByRole("button", { name: "Search", exact: true }).click();

    const cardHeading = page.getByRole("heading", { name: fixtures.publicBookTitle });
    await expect(cardHeading).toBeVisible();
    await expect(page.getByText("PUBLIC").first()).toBeVisible();
  });

  test("redirects to login when a guest tries to reserve a book, instead of borrowing directly", async ({ page }) => {
    await page.goto("/library");
    await page.getByPlaceholder("Search by title, author, or ISBN…").fill(fixtures.publicBookTitle);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("heading", { name: fixtures.publicBookTitle }).click();

    await expect(page).toHaveURL(/\/library\/[a-f0-9-]+/);
    await page.getByRole("button", { name: /Reserve Book|Place Hold/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
