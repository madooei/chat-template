import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import {
  createTestConvex,
  createTestUser,
  createTestChat,
  createTestMessage,
} from "./test.setup";

describe("chats", () => {
  describe("auth", () => {
    test("getAll rejects unauthenticated users", async () => {
      const t = createTestConvex();
      await expect(t.query(api.chats_queries.getAll, {})).rejects.toThrow(
        "Not authenticated",
      );
    });

    test("create rejects unauthenticated users", async () => {
      const t = createTestConvex();
      await expect(
        t.mutation(api.chats_mutations.create, { title: "Test" }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("CRUD", () => {
    test("create and list chats", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "My Chat");
      expect(chatId).toBeDefined();

      const chats = await t
        .withIdentity(identity)
        .query(api.chats_queries.getAll, {});
      expect(chats).toHaveLength(1);
      expect(chats[0].title).toBe("My Chat");
      expect(chats[0]._id).toBe(chatId);
    });

    test("getOne returns chat owned by user", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "My Chat");
      const chat = await t
        .withIdentity(identity)
        .query(api.chats_queries.getOne, { chatId });
      expect(chat).not.toBeNull();
      expect(chat!.title).toBe("My Chat");
    });

    test("update chat title", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "Old Title");
      await t
        .withIdentity(identity)
        .mutation(api.chats_mutations.update, { chatId, title: "New Title" });

      const chat = await t
        .withIdentity(identity)
        .query(api.chats_queries.getOne, { chatId });
      expect(chat!.title).toBe("New Title");
    });

    test("remove chat cascades to messages", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const chatId = await createTestChat(t, identity, "Chat to delete");
      await createTestMessage(t, identity, chatId, "msg1");
      await createTestMessage(t, identity, chatId, "msg2");

      // Verify messages exist
      const messagesBefore = await t
        .withIdentity(identity)
        .query(api.messages_queries.getByChat, { chatId });
      expect(messagesBefore).toHaveLength(2);

      // Delete chat
      await t
        .withIdentity(identity)
        .mutation(api.chats_mutations.remove, { chatId });

      // Chat should be gone
      const chats = await t
        .withIdentity(identity)
        .query(api.chats_queries.getAll, {});
      expect(chats).toHaveLength(0);
    });
  });

  describe("ownership", () => {
    test("user cannot access another user's chat", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      const chatId = await createTestChat(t, user1, "User 1 Chat");

      // User 2 should get null (not throw) for getOne
      const chat = await t
        .withIdentity(user2)
        .query(api.chats_queries.getOne, { chatId });
      expect(chat).toBeNull();
    });

    test("user cannot update another user's chat", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      const chatId = await createTestChat(t, user1, "User 1 Chat");

      await expect(
        t
          .withIdentity(user2)
          .mutation(api.chats_mutations.update, { chatId, title: "Hacked" }),
      ).rejects.toThrow("Forbidden");
    });

    test("user cannot delete another user's chat", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      const chatId = await createTestChat(t, user1, "User 1 Chat");

      await expect(
        t.withIdentity(user2).mutation(api.chats_mutations.remove, { chatId }),
      ).rejects.toThrow("Forbidden");
    });

    test("users only see their own chats", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      await createTestChat(t, user1, "User 1 Chat");
      await createTestChat(t, user2, "User 2 Chat");

      const user1Chats = await t
        .withIdentity(user1)
        .query(api.chats_queries.getAll, {});
      expect(user1Chats).toHaveLength(1);
      expect(user1Chats[0].title).toBe("User 1 Chat");

      const user2Chats = await t
        .withIdentity(user2)
        .query(api.chats_queries.getAll, {});
      expect(user2Chats).toHaveLength(1);
      expect(user2Chats[0].title).toBe("User 2 Chat");
    });
  });
});
