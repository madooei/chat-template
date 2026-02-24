import type { Id, Doc } from "./_generated/dataModel";
import type { AuthQueryCtx, AuthMutationCtx } from "./lib";

// ── Read helpers ─────────────────────────────────────────────────

export async function getUserById(
  ctx: AuthQueryCtx | AuthMutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users"> | null> {
  return ctx.db.get(userId);
}

// ── Write helpers ────────────────────────────────────────────────

export async function updateUser(
  ctx: AuthMutationCtx,
  userId: Id<"users">,
  fields: { name?: string },
): Promise<void> {
  await ctx.db.patch(userId, fields);
}
