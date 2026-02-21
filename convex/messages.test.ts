import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
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

  describe("clientId support", () => {
    test("create message with clientId stores and returns it", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      await t.withIdentity(identity).mutation(api.messages_mutations.create, {
        chatId,
        role: "user",
        content: "Hello",
        clientId: "client-uuid-123",
      });

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages).toHaveLength(1);
      expect(messages[0].clientId).toBe("client-uuid-123");
    });

    test("create message without clientId works (backward compat)", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      await t.withIdentity(identity).mutation(api.messages_mutations.create, {
        chatId,
        role: "user",
        content: "Hello",
      });

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages).toHaveLength(1);
      expect(messages[0].clientId).toBeUndefined();
    });
  });

  describe("streaming lifecycle", () => {
    test("createStreamingMessage inserts incomplete message", async () => {
      const t = createTestConvex();
      const { userId, identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      const messageId = await t.mutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model: "test-model" },
      );
      expect(messageId).toBeDefined();

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("");
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].isComplete).toBe(false);
    });

    test("updateStreamingContent patches content", async () => {
      const t = createTestConvex();
      const { userId, identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      const messageId = await t.mutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model: "test-model" },
      );

      await t.mutation(internal.messages_internals.updateStreamingContent, {
        messageId,
        content: "Hello world",
      });

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages[0].content).toBe("Hello world");
      expect(messages[0].isComplete).toBe(false);
    });

    test("completeStreamingMessage marks complete with final content", async () => {
      const t = createTestConvex();
      const { userId, identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      const messageId = await t.mutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model: "test-model" },
      );

      await t.mutation(internal.messages_internals.completeStreamingMessage, {
        messageId,
        content: "Final answer",
      });

      const messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages[0].content).toBe("Final answer");
      expect(messages[0].isComplete).toBe(true);
    });

    test("full streaming lifecycle: create → update → complete", async () => {
      const t = createTestConvex();
      const { userId, identity } = await createTestUser(t);
      const chatId = await createTestChat(t, identity, "Test Chat");

      // Create
      const messageId = await t.mutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model: "test-model" },
      );

      // Flush partial content
      await t.mutation(internal.messages_internals.updateStreamingContent, {
        messageId,
        content: "The answer",
      });

      let messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages[0].isComplete).toBe(false);
      expect(messages[0].content).toBe("The answer");

      // Complete
      await t.mutation(internal.messages_internals.completeStreamingMessage, {
        messageId,
        content: "The answer is 42.",
      });

      messages = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messages[0].isComplete).toBe(true);
      expect(messages[0].content).toBe("The answer is 42.");
    });
  });
});
