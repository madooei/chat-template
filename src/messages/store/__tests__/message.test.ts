import {
  $messages,
  addMessage,
  updateMessage,
  removeMessage,
  removeMessagesByChatId,
  clearMessages,
  decodeMessages,
} from "../message";
import { idbGet } from "@/store/idb";
import { createTestMessage } from "@/test/helpers";

beforeEach(() => {
  $messages.set([]);
});

describe("message store", () => {
  it("starts with an empty array", () => {
    expect($messages.get()).toEqual([]);
  });

  it("addMessage appends a message", () => {
    const msg = createTestMessage({ _id: "m1", content: "Hello" });
    addMessage(msg);

    expect($messages.get()).toHaveLength(1);
    expect($messages.get()[0]).toEqual(msg);
  });

  it("updateMessage replaces the matching message", () => {
    const msg = createTestMessage({ _id: "m1", content: "Old" });
    addMessage(msg);

    updateMessage({ ...msg, content: "New" });

    expect($messages.get()[0].content).toBe("New");
  });

  it("removeMessage removes the matching message", () => {
    addMessage(createTestMessage({ _id: "m1" }));
    addMessage(createTestMessage({ _id: "m2" }));

    removeMessage("m1");

    expect($messages.get()).toHaveLength(1);
    expect($messages.get()[0]._id).toBe("m2");
  });

  it("removeMessagesByChatId cascades deletion", () => {
    addMessage(createTestMessage({ _id: "m1", chatId: "chat-a" }));
    addMessage(createTestMessage({ _id: "m2", chatId: "chat-a" }));
    addMessage(createTestMessage({ _id: "m3", chatId: "chat-b" }));

    removeMessagesByChatId("chat-a");

    expect($messages.get()).toHaveLength(1);
    expect($messages.get()[0]._id).toBe("m3");
  });

  it("clearMessages empties the store", () => {
    addMessage(createTestMessage({ _id: "m1" }));
    addMessage(createTestMessage({ _id: "m2" }));

    clearMessages();

    expect($messages.get()).toEqual([]);
  });

  describe("Zod decode safety", () => {
    it("returns empty array for non-array input", () => {
      expect(decodeMessages("not-an-array")).toEqual([]);
    });

    it("filters out invalid items", () => {
      const validMsg = createTestMessage({
        _id: "m1",
        chatId: "c1",
        role: "user",
        content: "Hi",
      });
      const input = [
        validMsg,
        { _id: "m2" }, // missing fields
        "not-an-object",
      ];

      const result = decodeMessages(input);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("m1");
    });
  });

  it("persistence roundtrip", async () => {
    const msg = createTestMessage({ _id: "m1", content: "Persisted" });
    addMessage(msg);

    // Let the fire-and-forget idbPut settle
    await new Promise((r) => setTimeout(r, 0));

    const stored = await idbGet<unknown[]>("messages", "data");
    expect(stored).toBeTruthy();
    expect(stored).toHaveLength(1);
    expect((stored![0] as { content: string }).content).toBe("Persisted");
  });
});
