import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import {
  createTestConvex,
  createTestUser,
  createTestChat,
  createTestMessage,
} from "./test.setup";

describe("messages", () => {
  describe("auth", () => {
    test("create rejects unauthenticated users", async () => {
      const t = createTestConvex();

      // We need a valid chatId, so create a user + chat first
      const { identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      await expect(
        t.mutation(api.messages_mutations.create, {
          chatId,
          role: "user",
          content: "Hello",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("CRUD", () => {
    test("create and list messages", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "Test Chat");
      const msgId = await createTestMessage(t, identity, chatId, "Hello world");
      expect(msgId).toBeDefined();

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Hello world");
      expect(messages[0].role).toBe("user");
      expect(messages[0].chatId).toBe(chatId);
    });

    test("messages are ordered chronologically", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "Test Chat");
      await createTestMessage(t, identity, chatId, "First");
      await createTestMessage(t, identity, chatId, "Second", "assistant");
      await createTestMessage(t, identity, chatId, "Third");

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe("First");
      expect(messages[1].content).toBe("Second");
      expect(messages[1].role).toBe("assistant");
      expect(messages[2].content).toBe("Third");
    });
  });

  describe("ownership", () => {
    test("user cannot read messages from another user's chat", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      const chatId = await createTestChat(t, user1, "User 1 Chat");
      await createTestMessage(t, user1, chatId, "Secret message");

      await expect(
        t.withIdentity(user2).query(api.messages_queries.getByChat, { chatId }),
      ).rejects.toThrow("Forbidden");
    });

    test("user cannot create messages in another user's chat", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      const chatId = await createTestChat(t, user1, "User 1 Chat");

      await expect(
        t.withIdentity(user2).mutation(api.messages_mutations.create, {
          chatId,
          role: "user",
          content: "Injected",
        }),
      ).rejects.toThrow("Forbidden");
    });
  });
});
