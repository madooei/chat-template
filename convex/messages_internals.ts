import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { insertMessage } from "./messages_helpers";

/**
 * Create a placeholder assistant message before streaming begins.
 * Returns the message ID for subsequent updates.
 */
export const createStreamingMessage = internalMutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, userId, model }) => {
    return insertMessage(ctx.db, {
      chatId,
      userId,
      role: "assistant",
      content: "",
      model,
      isComplete: false,
    });
  },
});

/**
 * Flush accumulated streaming content to an existing message.
 */
export const updateStreamingContent = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, { messageId, content }) => {
    await ctx.db.patch(messageId, { content });
  },
});

/**
 * Mark a streaming message as complete with final content.
 */
export const completeStreamingMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, { messageId, content }) => {
    await ctx.db.patch(messageId, { content, isComplete: true });
  },
});

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
    await insertMessage(ctx.db, {
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
