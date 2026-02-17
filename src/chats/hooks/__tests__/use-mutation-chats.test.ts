import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { $chats } from "@/chats/store/chat";
import { useMutationChats } from "../use-mutation-chats";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  $chats.set([]);
});

describe("useMutationChats", () => {
  it("add() creates a chat and returns its ID", async () => {
    const { result } = renderHook(() => useMutationChats());

    let chatId: string | null = null;
    await act(async () => {
      chatId = await result.current.add({ title: "New Chat" });
    });

    expect(chatId).toBe("test-uuid-1");
    expect($chats.get()).toHaveLength(1);
    expect($chats.get()[0].title).toBe("New Chat");
  });
});
