import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// The "New Chat" button appears in both the sidebar and the home empty state.
// Scope to the sidebar (complementary role) for consistent behavior.
function newChatButton(page: import("@playwright/test").Page) {
  return page
    .getByRole("complementary")
    .getByRole("button", { name: "New Chat" });
}

test.describe("Chat flow", () => {
  test("home page loads with empty state", async ({ page }) => {
    await expect(
      page.getByText("No chats yet. Create one to get started!"),
    ).toBeVisible();
  });

  test("create chat via New Chat button", async ({ page }) => {
    await newChatButton(page).click();

    await expect(page).toHaveURL(/\/chats\/.*\/messages/);
  });

  test("chat appears in sidebar after creation", async ({ page }) => {
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await expect(
      page
        .getByRole("complementary")
        .getByRole("listitem")
        .filter({ hasText: "New Chat" }),
    ).toBeVisible();
  });

  test("edit chat title", async ({ page }) => {
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await page.getByRole("button", { name: "Edit chat" }).click();

    await expect(page.getByText("Edit Chat")).toBeVisible();

    const input = page.getByPlaceholder("Chat title");
    await input.clear();
    await input.fill("Renamed Chat");

    await page.getByRole("button", { name: "Save" }).click();

    // Verify in sidebar (scoped to avoid matching the page header too)
    await expect(
      page.getByRole("complementary").getByText("Renamed Chat"),
    ).toBeVisible();
  });

  test("delete chat with confirmation", async ({ page }) => {
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await page.getByRole("button", { name: "Delete chat" }).click();

    await expect(page.getByText("Are you absolutely sure?")).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("No chats yet. Create one to get started!"),
    ).toBeVisible();
  });

  test("search chats", async ({ page }) => {
    // Create first chat and rename it
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    await page.getByRole("button", { name: "Edit chat" }).click();
    const input = page.getByPlaceholder("Chat title");
    await input.clear();
    await input.fill("React Help");
    await page.getByRole("button", { name: "Save" }).click();

    // Navigate home and create second chat
    await page.goto("/");
    await newChatButton(page).click();
    await expect(page).toHaveURL(/\/chats\/.*\/messages/);

    // The second chat is now active, so "Edit chat" for it is unique
    // (only one chat is active, so only one set of action buttons is visible via hover)
    // Use the listitem filter to target the correct chat's edit button
    await page
      .getByRole("listitem")
      .filter({ hasText: "New Chat" })
      .getByLabel("Edit chat")
      .click();
    const input2 = page.getByPlaceholder("Chat title");
    await input2.clear();
    await input2.fill("Python Tips");
    await page.getByRole("button", { name: "Save" }).click();

    // Search for "React"
    await page.getByPlaceholder("Search chats...").fill("React");

    await expect(
      page.getByRole("complementary").getByText("React Help"),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary").getByText("Python Tips"),
    ).not.toBeVisible();
  });
});
