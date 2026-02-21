import type { Id, Doc } from "./_generated/dataModel";
import type { AuthQueryCtx, AuthMutationCtx } from "./lib";

/**
 * Fetch a chat and verify the current user owns it.
 * Returns the doc so callers avoid a redundant `ctx.db.get()`.
 * Throws on not-found or forbidden.
 */
export async function requireChatOwner(
  ctx: AuthQueryCtx | AuthMutationCtx,
  chatId: Id<"chats">,
): Promise<Doc<"chats">> {
  const chat = await ctx.db.get(chatId);
  if (!chat) throw new Error("Chat not found");
  if (chat.userId !== ctx.userId) throw new Error("Forbidden");
  return chat;
}
