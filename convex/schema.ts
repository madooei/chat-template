import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { chatTables } from "./chats_schema";
import { messageTables } from "./messages_schema";

export default defineSchema({
  ...authTables,
  ...chatTables,
  ...messageTables,
});
