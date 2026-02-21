import { v } from "convex/values";
import { defineTable } from "convex/server";

// ── Validator shapes ──────────────────────────────────────────────

/** Fields a client sends when creating a message. */
export const messageInFields = {
  chatId: v.id("chats"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  clientId: v.optional(v.string()),
};

/** Fields a client may patch (not currently used, but included for symmetry). */
export const messageUpdateFields = {
  content: v.optional(v.string()),
};

/** All stored fields (In + server-injected). */
export const messageInternalFields = {
  ...messageInFields,
  userId: v.id("users"),
  model: v.optional(v.string()),
  isComplete: v.optional(v.boolean()),
};

// Out = Doc<"messages"> (system fields _id, _creationTime added automatically)

// ── Table definition ──────────────────────────────────────────────

export const messageTables = {
  messages: defineTable(messageInternalFields)
    .index("by_chat_id", ["chatId"])
    .index("by_user_id", ["userId"]),
};
