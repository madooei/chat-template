import { getDb, idbGet, idbPut, ensureDbReady, resetDb } from "../idb";

beforeEach(async () => {
  await resetDb();
});

describe("idb", () => {
  describe("getDb", () => {
    it("returns a database with chats and messages stores", async () => {
      const db = await getDb();
      expect(db.objectStoreNames.contains("chats")).toBe(true);
      expect(db.objectStoreNames.contains("messages")).toBe(true);
    });

    it("returns the same promise on repeated calls", () => {
      const p1 = getDb();
      const p2 = getDb();
      expect(p1).toBe(p2);
    });
  });

  describe("idbGet / idbPut", () => {
    it("returns undefined for a missing key", async () => {
      const result = await idbGet("chats", "nonexistent");
      expect(result).toBeUndefined();
    });

    it("round-trips a value", async () => {
      await idbPut("chats", "data", [{ _id: "c1", title: "Hello" }]);

      const stored = await idbGet<unknown[]>("chats", "data");
      expect(stored).toHaveLength(1);
      expect((stored![0] as { title: string }).title).toBe("Hello");
    });

    it("overwrites an existing value", async () => {
      await idbPut("messages", "data", [1, 2]);
      await idbPut("messages", "data", [3]);

      const stored = await idbGet<number[]>("messages", "data");
      expect(stored).toEqual([3]);
    });
  });

  describe("ensureDbReady", () => {
    it("resolves without error", async () => {
      await expect(ensureDbReady()).resolves.toBeUndefined();
    });

    it("is idempotent — second call resolves immediately", async () => {
      await ensureDbReady();
      await expect(ensureDbReady()).resolves.toBeUndefined();
    });
  });

  describe("resetDb", () => {
    it("clears all stored data", async () => {
      await idbPut("chats", "data", [{ _id: "c1" }]);
      await resetDb();

      const result = await idbGet("chats", "data");
      expect(result).toBeUndefined();
    });

    it("allows the database to be re-opened after reset", async () => {
      await idbPut("chats", "data", "before");
      await resetDb();

      await idbPut("chats", "data", "after");
      const result = await idbGet<string>("chats", "data");
      expect(result).toBe("after");
    });
  });
});
