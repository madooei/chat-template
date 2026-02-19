import { v } from "convex/values";
import { defineTable } from "convex/server";

// ── Validator shapes ──────────────────────────────────────────────
// 4-level type hierarchy: In → Update → Internal → Out

/** Fields a client sends when creating a chat. */
export const chatInFields = {
  title: v.string(),
};

/** Fields a client may patch. */
export const chatUpdateFields = {
  title: v.optional(v.string()),
};

/** All stored fields (In + server-injected). */
export const chatInternalFields = {
  ...chatInFields,
  userId: v.id("users"),
};

// Out = Doc<"chats"> (system fields _id, _creationTime added automatically)

// ── Table definition ──────────────────────────────────────────────

export const chatTables = {
  chats: defineTable(chatInternalFields).index("by_user_id", ["userId"]),
};
