import { test, expect } from "@playwright/test";

test.describe("Homepage smoke test", () => {
  test("loads without a client-side error and exposes core navigation", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);

    // Public, unauthenticated navigation should reach every core module.
    await expect(page.getByRole("link", { name: "Library", exact: true }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
