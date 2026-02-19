import { v } from "convex/values";
import { queryWithAuth } from "./lib";
import { requireMessageChatOwner } from "./messages_guards";
import { getMessagesByChat } from "./messages_helpers";
import { toMessageOut } from "./messages_helpers";

export const getByChat = queryWithAuth({
  args: { chatId: v.id("chats") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      chatId: v.id("chats"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      model: v.optional(v.string()),
      userId: v.id("users"),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, { chatId }) => {
    await requireMessageChatOwner(ctx, chatId);
    const messages = await getMessagesByChat(ctx, chatId);
    return messages.map(toMessageOut);
  },
});
