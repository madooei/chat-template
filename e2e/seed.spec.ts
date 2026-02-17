import { test, expect } from "@playwright/test";

// Seed test — demonstrates the shared setup that every E2E test uses.
// The planner and generator agents read this file to understand the
// application's starting state and common patterns.

test.describe("Seed", () => {
  test("app loads with clean state", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Home page renders the empty-state message
    await expect(
      page.getByText("No chats yet. Create one to get started!"),
    ).toBeVisible();
  });
});
