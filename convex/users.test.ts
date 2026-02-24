import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { createTestConvex, createTestUser } from "./test.setup";

describe("users", () => {
  describe("auth", () => {
    test("getMe rejects unauthenticated users", async () => {
      const t = createTestConvex();
      await expect(t.query(api.users_queries.getMe, {})).rejects.toThrow(
        "Not authenticated",
      );
    });

    test("updateMe rejects unauthenticated users", async () => {
      const t = createTestConvex();
      await expect(
        t.mutation(api.users_mutations.updateMe, { name: "Hacker" }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("getMe", () => {
    test("returns name for authenticated user", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      const me = await t
        .withIdentity(identity)
        .query(api.users_queries.getMe, {});
      expect(me).toEqual({ name: "" });
    });

    test("returns name after it has been set", async () => {
      const t = createTestConvex();
      const { userId, identity } = await createTestUser(t);

      await t.run(async (ctx) => {
        await ctx.db.patch(userId, { name: "Alice" });
      });

      const me = await t
        .withIdentity(identity)
        .query(api.users_queries.getMe, {});
      expect(me).toEqual({ name: "Alice" });
    });
  });

  describe("updateMe", () => {
    test("updates the user name", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      await t
        .withIdentity(identity)
        .mutation(api.users_mutations.updateMe, { name: "Bob" });

      const me = await t
        .withIdentity(identity)
        .query(api.users_queries.getMe, {});
      expect(me.name).toBe("Bob");
    });

    test("updates name to empty string", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      await t
        .withIdentity(identity)
        .mutation(api.users_mutations.updateMe, { name: "Alice" });
      await t
        .withIdentity(identity)
        .mutation(api.users_mutations.updateMe, { name: "" });

      const me = await t
        .withIdentity(identity)
        .query(api.users_queries.getMe, {});
      expect(me.name).toBe("");
    });

    test("omitting name clears it (patch receives undefined)", async () => {
      const t = createTestConvex();
      const { identity } = await createTestUser(t);

      await t
        .withIdentity(identity)
        .mutation(api.users_mutations.updateMe, { name: "Alice" });
      await t.withIdentity(identity).mutation(api.users_mutations.updateMe, {});

      // name is cleared because { name: undefined } removes the field via patch
      const me = await t
        .withIdentity(identity)
        .query(api.users_queries.getMe, {});
      expect(me.name).toBe("");
    });
  });

  describe("isolation", () => {
    test("one user's update does not affect another user", async () => {
      const t = createTestConvex();
      const { identity: user1 } = await createTestUser(t);
      const { identity: user2 } = await createTestUser(t);

      await t
        .withIdentity(user1)
        .mutation(api.users_mutations.updateMe, { name: "Alice" });
      await t
        .withIdentity(user2)
        .mutation(api.users_mutations.updateMe, { name: "Bob" });

      const me1 = await t
        .withIdentity(user1)
        .query(api.users_queries.getMe, {});
      const me2 = await t
        .withIdentity(user2)
        .query(api.users_queries.getMe, {});

      expect(me1.name).toBe("Alice");
      expect(me2.name).toBe("Bob");
    });
  });
});
