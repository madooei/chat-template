import { LibSQLStore } from "@mastra/libsql";

export const storage = new LibSQLStore({
  id: "main",
  url: "file:../mastra.db",
});
