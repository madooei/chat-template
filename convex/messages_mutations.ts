import { v } from "convex/values";
import { mutationWithAuth } from "./lib";
import { requireMessageChatOwner } from "./messages_guards";
import { createMessage } from "./messages_helpers";

export const create = mutationWithAuth({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    clientId: v.optional(v.string()),
  },
  returns: v.id("messages"),
  handler: async (ctx, { chatId, role, content, clientId }) => {
    await requireMessageChatOwner(ctx, chatId);
    return createMessage(ctx, { chatId, role, content, clientId });
  },
});
