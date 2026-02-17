import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
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

    // An error toast should appear since no API key is set
    await expect(page.getByText("API key not configured")).toBeVisible();
  });

  test("messages persist after reload", async ({ page }) => {
    // Seed localStorage with a chat and message directly
    const chatId = "test-chat-persist";
    await page.evaluate((id) => {
      localStorage.setItem(
        "chats",
        JSON.stringify([
          { _id: id, title: "Persist Test", _creationTime: Date.now() },
        ]),
      );
      localStorage.setItem(
        "messages",
        JSON.stringify([
          {
            _id: "msg-1",
            chatId: id,
            role: "user",
            content: "Persisted message",
            _creationTime: Date.now(),
          },
        ]),
      );
    }, chatId);

    // Navigate to the chat
    await page.goto(`/chats/${chatId}/messages`);
    await expect(page.getByText("Persisted message")).toBeVisible();

    // Reload and verify the message is still there
    await page.reload();
    await expect(page.getByText("Persisted message")).toBeVisible();
  });
});
