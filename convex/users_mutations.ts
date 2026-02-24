import { v } from "convex/values";
import { mutationWithAuth } from "./lib";
import { updateUser } from "./users_helpers";

export const updateMe = mutationWithAuth({
  args: { name: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { name }) => {
    await updateUser(ctx, ctx.userId, { name });
    return null;
  },
});
