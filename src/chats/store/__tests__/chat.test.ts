import { testStorage } from "@/test/setup";
import {
  $chats,
  addChat,
  updateChat,
  removeChat,
  clearChats,
  decodeChats,
} from "../chat";
import { createTestChat } from "@/test/helpers";

beforeEach(() => {
  $chats.set([]);
});

describe("chat store", () => {
  it("starts with an empty array", () => {
    expect($chats.get()).toEqual([]);
  });

  it("addChat appends a chat", () => {
    const chat = createTestChat({ _id: "c1", title: "First" });
    addChat(chat);

    expect($chats.get()).toHaveLength(1);
    expect($chats.get()[0]).toEqual(chat);
  });

  it("updateChat replaces the matching chat", () => {
    const chat = createTestChat({ _id: "c1", title: "Old" });
    addChat(chat);

    updateChat({ ...chat, title: "New" });

    expect($chats.get()[0].title).toBe("New");
  });

  it("updateChat with non-existent ID is a no-op", () => {
    const chat = createTestChat({ _id: "c1", title: "Only" });
    addChat(chat);

    updateChat(createTestChat({ _id: "nope", title: "Ghost" }));

    expect($chats.get()).toHaveLength(1);
    expect($chats.get()[0].title).toBe("Only");
  });

  it("removeChat removes the matching chat", () => {
    addChat(createTestChat({ _id: "c1" }));
    addChat(createTestChat({ _id: "c2" }));

    removeChat("c1");

    expect($chats.get()).toHaveLength(1);
    expect($chats.get()[0]._id).toBe("c2");
  });

  it("clearChats empties the store", () => {
    addChat(createTestChat({ _id: "c1" }));
    addChat(createTestChat({ _id: "c2" }));

    clearChats();

    expect($chats.get()).toEqual([]);
  });

  describe("Zod decode safety", () => {
    it("returns empty array for malformed JSON", () => {
      expect(decodeChats("not-json")).toEqual([]);
    });

    it("filters out invalid items", () => {
      const validChat = createTestChat({ _id: "c1", title: "Valid" });
      const raw = JSON.stringify([
        validChat,
        { _id: "c2" }, // missing title
        { title: "No ID" }, // missing _id
        "not-an-object",
      ]);

      const result = decodeChats(raw);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("c1");
    });
  });

  it("persistence roundtrip", () => {
    const chat = createTestChat({ _id: "c1", title: "Persisted" });
    addChat(chat);

    const stored = testStorage["chats"];
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("Persisted");
  });
});
