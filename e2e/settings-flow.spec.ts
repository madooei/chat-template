import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

function settingsButton(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: "Settings" });
}

test.describe("Settings flow", () => {
  test("open settings dialog", async ({ page }) => {
    await settingsButton(page).click();

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Display Name")).toBeVisible();
    await expect(page.getByLabel("Gemini API Key")).toBeVisible();
  });

  test("update display name and API key", async ({ page }) => {
    await settingsButton(page).click();

    await page.getByLabel("Display Name").fill("Test User");
    await page.getByLabel("Gemini API Key").fill("test-api-key-123");

    await page.getByRole("button", { name: "Save" }).click();

    // Dialog should close after save
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).not.toBeVisible();
  });

  test("settings persist after reload", async ({ page }) => {
    await settingsButton(page).click();
    await page.getByLabel("Display Name").fill("Persistent User");
    await page.getByLabel("Gemini API Key").fill("persistent-key");
    await page.getByRole("button", { name: "Save" }).click();

    await page.reload();

    await settingsButton(page).click();
    await expect(page.getByLabel("Display Name")).toHaveValue(
      "Persistent User",
    );
    await expect(page.getByLabel("Gemini API Key")).toHaveValue(
      "persistent-key",
    );
  });
});
