import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Save the assistant's response after the stream completes.
 */
export const saveAssistantMessage = internalMutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    content: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, userId, content, model }) => {
    await ctx.db.insert("messages", {
      chatId,
      userId,
      role: "assistant",
      content,
      model,
    });
  },
});

/**
 * Auto-generate a title for a chat after the first exchange.
 */
export const updateChatTitle = internalMutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    await ctx.db.patch(chatId, { title });
  },
});

/**
 * Get messages for a chat as { role, content }[] for AI context.
 */
export const getMessagesByChat = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect();

    return messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  },
});

/**
 * Verify that a user owns a chat. Used by the HTTP action for auth.
 */
export const verifyChatOwnership = internalQuery({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, { chatId, userId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) return { ok: false as const, error: "Chat not found" };
    if (chat.userId !== userId)
      return { ok: false as const, error: "Forbidden" };
    return { ok: true as const, title: chat.title };
  },
});
