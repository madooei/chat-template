import type { Id, Doc } from "./_generated/dataModel";
import type { AuthQueryCtx, AuthMutationCtx } from "./lib";

// ── Read helpers ─────────────────────────────────────────────────

export async function getAllChats(ctx: AuthQueryCtx): Promise<Doc<"chats">[]> {
  return ctx.db
    .query("chats")
    .withIndex("by_user_id", (q) => q.eq("userId", ctx.userId))
    .collect();
}

export async function getChatById(
  ctx: AuthQueryCtx | AuthMutationCtx,
  chatId: Id<"chats">,
): Promise<Doc<"chats"> | null> {
  return ctx.db.get(chatId);
}

// ── Write helpers ────────────────────────────────────────────────

export async function createChat(
  ctx: AuthMutationCtx,
  fields: { title: string },
): Promise<Id<"chats">> {
  return ctx.db.insert("chats", {
    title: fields.title,
    userId: ctx.userId,
  });
}

export async function updateChat(
  ctx: AuthMutationCtx,
  chatId: Id<"chats">,
  fields: { title?: string },
): Promise<void> {
  await ctx.db.patch(chatId, fields);
}

export async function deleteChatWithMessages(
  ctx: AuthMutationCtx,
  chatId: Id<"chats">,
): Promise<void> {
  // Delete all messages belonging to this chat
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
    .collect();

  for (const message of messages) {
    await ctx.db.delete(message._id);
  }

  // Delete the chat itself
  await ctx.db.delete(chatId);
}

// ── Output transform ─────────────────────────────────────────────

export function toChatOut(chat: Doc<"chats">) {
  return {
    _id: chat._id,
    title: chat.title,
    userId: chat.userId,
    _creationTime: chat._creationTime,
  };
}
