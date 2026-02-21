import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    const request = indexedDB.deleteDatabase("chat-app");
    return new Promise<void>((resolve) => {
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
});

function newChatButton(page: import("@playwright/test").Page) {
  return page
    .getByRole("complementary")
    .getByRole("button", { name: "New Chat" });
}

test.describe("Message flow", () => {
  test("empty state shows suggestions", async ({ page }) => {
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await expect(page.getByText("How can I help you today?")).toBeVisible();
    await expect(
      page.getByText("Explain quantum computing in simple terms"),
    ).toBeVisible();
  });

  test("type and send a message (without API key shows error)", async ({
    page,
  }) => {
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await page.getByPlaceholder("Ask anything...").fill("Hello, world!");

    await page.getByRole("button", { name: "Send message" }).click();

    // In Phase 2, the app uses a Convex backend. During E2E tests the backend
    // is not running, so the SSE request fails with a network error.
    await expect(
      page.getByText(
        "Network error. Check your internet connection and try again.",
      ),
    ).toBeVisible();
  });

  test("chats persist after reload", async ({ page }) => {
    // Phase 2 uses Convex for data storage, not IndexedDB. Create a chat
    // through the UI and verify it persists across a page reload via Convex.
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    // The new chat should appear in the sidebar with the default title
    await expect(
      page
        .getByRole("complementary")
        .getByRole("listitem")
        .filter({ hasText: "New Chat" }),
    ).toBeVisible();

    // Reload and verify the chat is still listed (persisted in Convex)
    await page.reload();
    await expect(
      page
        .getByRole("complementary")
        .getByRole("listitem")
        .filter({ hasText: "New Chat" }),
    ).toBeVisible();
  });
});
