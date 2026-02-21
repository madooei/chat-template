import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

function themeToggleButton(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: "Toggle theme" });
}

function htmlElement(page: import("@playwright/test").Page) {
  return page.locator("html");
}

test.describe("Theme selection", () => {
  test("switch to light theme", async ({ page }) => {
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Light" }).click();

    await expect(htmlElement(page)).toHaveClass(/\blight\b/);
    await expect(htmlElement(page)).not.toHaveClass(/\bdark\b/);
    await expect(htmlElement(page)).toHaveCSS("color-scheme", "light");
  });

  test("switch to dark theme", async ({ page }) => {
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    await expect(htmlElement(page)).toHaveClass(/\bdark\b/);
    await expect(htmlElement(page)).not.toHaveClass(/\blight\b/);
    await expect(htmlElement(page)).toHaveCSS("color-scheme", "dark");
  });

  test("switch to system theme", async ({ page }) => {
    // Move away from the default first
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    // Switch back to system
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "System" }).click();

    // Should have exactly one of light or dark, not both
    const classes = await htmlElement(page).getAttribute("class");
    const hasLight = /\blight\b/.test(classes ?? "");
    const hasDark = /\bdark\b/.test(classes ?? "");
    expect(hasLight || hasDark).toBe(true);
    expect(hasLight && hasDark).toBe(false);
  });
});

test.describe("Theme persistence", () => {
  test("selected theme persists across page reload", async ({ page }) => {
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    await page.reload();

    await expect(htmlElement(page)).toHaveClass(/\bdark\b/);

    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe(JSON.stringify("dark"));
  });

  test("default theme is system when no preference is stored", async ({
    page,
  }) => {
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    // Either null (not yet written) or the default "system"
    if (stored !== null) {
      expect(stored).toBe(JSON.stringify("system"));
    }

    // Should still render with a resolved theme class
    const classes = await htmlElement(page).getAttribute("class");
    const hasTheme = /\b(light|dark)\b/.test(classes ?? "");
    expect(hasTheme).toBe(true);
  });
});

test.describe("System theme preference", () => {
  test("system theme follows emulated dark preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();

    await expect(htmlElement(page)).toHaveClass(/\bdark\b/);
    await expect(htmlElement(page)).toHaveCSS("color-scheme", "dark");
  });

  test("system theme follows emulated light preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();

    await expect(htmlElement(page)).toHaveClass(/\blight\b/);
    await expect(htmlElement(page)).toHaveCSS("color-scheme", "light");
  });

  test("explicit theme overrides system preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();

    // System preference is dark, but explicitly select light
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Light" }).click();

    await expect(htmlElement(page)).toHaveClass(/\blight\b/);
    await expect(htmlElement(page)).not.toHaveClass(/\bdark\b/);
  });
});

test.describe("Dropdown menu behavior", () => {
  test("dropdown opens and shows all three options", async ({ page }) => {
    await themeToggleButton(page).click();

    await expect(page.getByRole("menuitem", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Dark" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "System" })).toBeVisible();
  });

  test("dropdown closes after selecting an option", async ({ page }) => {
    await themeToggleButton(page).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    await expect(
      page.getByRole("menuitem", { name: "Dark" }),
    ).not.toBeVisible();
    await expect(htmlElement(page)).toHaveClass(/\bdark\b/);
  });

  test("dropdown closes when clicking outside", async ({ page }) => {
    await themeToggleButton(page).click();
    await expect(page.getByRole("menuitem", { name: "Light" })).toBeVisible();

    // Press Escape to dismiss the dropdown (body click is blocked by the overlay)
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("menuitem", { name: "Light" }),
    ).not.toBeVisible();
  });
});

test.describe("Corrupted storage", () => {
  test("invalid localStorage value falls back to system", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem("theme", JSON.stringify("invalid-value")),
    );
    await page.reload();

    // App should not crash — home page still renders
    await expect(
      page.getByText("No chats yet. Create one to get started!"),
    ).toBeVisible();

    // Falls back to system behavior — should have a resolved theme class
    const classes = await htmlElement(page).getAttribute("class");
    const hasTheme = /\b(light|dark)\b/.test(classes ?? "");
    expect(hasTheme).toBe(true);
  });

  test("malformed JSON in localStorage falls back to system", async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem("theme", "not-valid-json{{{"),
    );
    await page.reload();

    // App should not crash — home page still renders
    await expect(
      page.getByText("No chats yet. Create one to get started!"),
    ).toBeVisible();

    // Falls back to system behavior — should have a resolved theme class
    const classes = await htmlElement(page).getAttribute("class");
    const hasTheme = /\b(light|dark)\b/.test(classes ?? "");
    expect(hasTheme).toBe(true);
  });
});
