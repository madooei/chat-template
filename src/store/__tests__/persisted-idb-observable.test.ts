import { vi } from "vitest";
import { idbGet, idbPut, ensureDbReady } from "@/store/idb";
import { createPersistedIdbObservable } from "../persisted-idb-observable";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

beforeEach(async () => {
  await ensureDbReady();
});

describe("createPersistedIdbObservable", () => {
  it("initialises with the default value", () => {
    const { obs } = createPersistedIdbObservable<string[]>(
      "chats",
      "test-init",
      [],
      (v) => v as string[],
    );
    expect(obs.get()).toEqual([]);
  });

  it("hydrates from IndexedDB", async () => {
    await idbPut("chats", "test-hydrate", ["a", "b"]);

    const { obs, hydrated } = createPersistedIdbObservable<string[]>(
      "chats",
      "test-hydrate",
      [],
      (v) => v as string[],
    );
    await hydrated;

    expect(obs.get()).toEqual(["a", "b"]);
  });

  it("falls back to default when decode throws", async () => {
    await idbPut("chats", "test-bad", "not-an-array");

    const decode = () => {
      throw new Error("bad data");
    };
    const { obs, hydrated } = createPersistedIdbObservable<string[]>(
      "chats",
      "test-bad",
      ["default"],
      decode,
    );
    await hydrated;

    expect(obs.get()).toEqual(["default"]);
  });

  it("persists changes back to IndexedDB", async () => {
    const { obs, hydrated } = createPersistedIdbObservable<string[]>(
      "chats",
      "test-persist",
      [],
      (v) => v as string[],
    );
    await hydrated;

    obs.set(["x", "y"]);

    // Let fire-and-forget idbPut settle
    await new Promise((r) => setTimeout(r, 0));

    const stored = await idbGet<string[]>("chats", "test-persist");
    expect(stored).toEqual(["x", "y"]);
  });

  it("uses the decode function during hydration", async () => {
    await idbPut("chats", "test-decode", [1, "bad", 3]);

    const decode = (v: unknown) =>
      Array.isArray(v)
        ? v.filter((x): x is number => typeof x === "number")
        : [];

    const { obs, hydrated } = createPersistedIdbObservable<number[]>(
      "chats",
      "test-decode",
      [],
      decode,
    );
    await hydrated;

    expect(obs.get()).toEqual([1, 3]);
  });
});
