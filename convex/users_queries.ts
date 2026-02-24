import { v } from "convex/values";
import { queryWithAuth } from "./lib";
import { getUserById } from "./users_helpers";

export const getMe = queryWithAuth({
  args: {},
  returns: v.object({ name: v.string() }),
  handler: async (ctx) => {
    const user = await getUserById(ctx, ctx.userId);
    return { name: user?.name ?? "" };
  },
});
