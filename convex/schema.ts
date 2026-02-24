import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { chatTables } from "./chats_schema";
import { messageTables } from "./messages_schema";

export default defineSchema({
  // Note: authTables provides the `users` table with an optional `name` field
  ...authTables,
  ...chatTables,
  ...messageTables,
});
