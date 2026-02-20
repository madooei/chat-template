import type { Id, Doc } from "./_generated/dataModel";
import type { DatabaseWriter } from "./_generated/server";
import type { AuthQueryCtx, AuthMutationCtx } from "./lib";

// ── Read helpers ─────────────────────────────────────────────────

export async function getMessagesByChat(
  ctx: AuthQueryCtx | AuthMutationCtx,
  chatId: Id<"chats">,
): Promise<Doc<"messages">[]> {
  return ctx.db
    .query("messages")
    .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
    .collect();
}

export async function getMessageById(
  ctx: AuthQueryCtx | AuthMutationCtx,
  messageId: Id<"messages">,
): Promise<Doc<"messages"> | null> {
  return ctx.db.get(messageId);
}

// ── Write helpers ────────────────────────────────────────────────

/** Low-level insert — every message creation goes through here. */
export async function insertMessage(
  db: DatabaseWriter,
  fields: {
    chatId: Id<"chats">;
    userId: Id<"users">;
    role: "user" | "assistant";
    content: string;
    model?: string;
    clientId?: string;
    isComplete?: boolean;
  },
): Promise<Id<"messages">> {
  return db.insert("messages", {
    chatId: fields.chatId,
    userId: fields.userId,
    role: fields.role,
    content: fields.content,
    model: fields.model,
    clientId: fields.clientId,
    isComplete: fields.isComplete,
  });
}

export async function createMessage(
  ctx: AuthMutationCtx,
  fields: {
    chatId: Id<"chats">;
    role: "user" | "assistant";
    content: string;
    model?: string;
    clientId?: string;
    isComplete?: boolean;
  },
): Promise<Id<"messages">> {
  return insertMessage(ctx.db, { ...fields, userId: ctx.userId });
}

export async function deleteMessage(
  ctx: AuthMutationCtx,
  messageId: Id<"messages">,
): Promise<void> {
  await ctx.db.delete(messageId);
}

// ── Output transform ─────────────────────────────────────────────

export function toMessageOut(message: Doc<"messages">) {
  return {
    _id: message._id,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    model: message.model,
    userId: message.userId,
    clientId: message.clientId,
    isComplete: message.isComplete,
    _creationTime: message._creationTime,
  };
}
