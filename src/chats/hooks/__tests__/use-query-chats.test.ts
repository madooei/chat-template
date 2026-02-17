import { renderHook } from "@testing-library/react";
import { $chats } from "@/chats/store/chat";
import { useQueryChats } from "../use-query-chats";
import { createTestChat } from "@/test/helpers";

beforeEach(() => {
  $chats.set([]);
});

describe("useQueryChats", () => {
  it("returns empty array when store is empty", () => {
    const { result } = renderHook(() => useQueryChats());

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it("returns chats when populated", () => {
    const chat1 = createTestChat({ _id: "c1", title: "First" });
    const chat2 = createTestChat({ _id: "c2", title: "Second" });
    $chats.set([chat1, chat2]);

    const { result } = renderHook(() => useQueryChats());

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe("First");
    expect(result.current.data[1].title).toBe("Second");
  });
});
