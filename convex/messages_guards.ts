import type { Id } from "./_generated/dataModel";
import type { AuthQueryCtx, AuthMutationCtx } from "./lib";
import { requireChatOwner } from "./chats_guards";

/**
 * Verify the current user owns the parent chat.
 * Authorization flows through the chat — if you own the chat, you can
 * access its messages.
 */
export async function requireMessageChatOwner(
  ctx: AuthQueryCtx | AuthMutationCtx,
  chatId: Id<"chats">,
): Promise<void> {
  await requireChatOwner(ctx, chatId);
}
