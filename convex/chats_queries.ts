import { v } from "convex/values";
import { queryWithAuth } from "./lib";
import { getAllChats } from "./chats_helpers";
import { requireChatOwner } from "./chats_guards";
import { toChatOut } from "./chats_helpers";

export const getAll = queryWithAuth({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("chats"),
      title: v.string(),
      userId: v.id("users"),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const chats = await getAllChats(ctx);
    return chats.map(toChatOut);
  },
});

export const getOne = queryWithAuth({
  args: { chatId: v.id("chats") },
  returns: v.union(
    v.object({
      _id: v.id("chats"),
      title: v.string(),
      userId: v.id("users"),
      _creationTime: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { chatId }) => {
    try {
      const chat = await requireChatOwner(ctx, chatId);
      return toChatOut(chat);
    } catch {
      return null;
    }
  },
});
