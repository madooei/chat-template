import { renderHook } from "@testing-library/react";
import { $messages } from "@/messages/store/message";
import { useQueryMessages } from "../use-query-messages";
import { createTestMessage } from "@/test/helpers";

beforeEach(() => {
  $messages.set([]);
});

describe("useQueryMessages", () => {
  it("filters messages by chatId", () => {
    $messages.set([
      createTestMessage({ _id: "m1", chatId: "chat-a", content: "Hello" }),
      createTestMessage({ _id: "m2", chatId: "chat-b", content: "World" }),
      createTestMessage({ _id: "m3", chatId: "chat-a", content: "Again" }),
    ]);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].content).toBe("Hello");
    expect(result.current.data[1].content).toBe("Again");
  });

  it("returns empty array for unknown chatId", () => {
    $messages.set([createTestMessage({ _id: "m1", chatId: "chat-a" })]);

    const { result } = renderHook(() => useQueryMessages("unknown"));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
