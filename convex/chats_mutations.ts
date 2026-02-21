import { v } from "convex/values";
import { mutationWithAuth } from "./lib";
import { requireChatOwner } from "./chats_guards";
import {
  createChat,
  updateChat,
  deleteChatWithMessages,
} from "./chats_helpers";

export const create = mutationWithAuth({
  args: { title: v.string() },
  returns: v.id("chats"),
  handler: async (ctx, { title }) => {
    return createChat(ctx, { title });
  },
});

export const update = mutationWithAuth({
  args: {
    chatId: v.id("chats"),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { chatId, title }) => {
    await requireChatOwner(ctx, chatId);
    await updateChat(ctx, chatId, { title });
    return null;
  },
});

export const remove = mutationWithAuth({
  args: { chatId: v.id("chats") },
  returns: v.null(),
  handler: async (ctx, { chatId }) => {
    await requireChatOwner(ctx, chatId);
    await deleteChatWithMessages(ctx, chatId);
    return null;
  },
});
