import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { $chats } from "@/chats/store/chat";
import { $messages } from "@/messages/store/message";
import { useMutationChat } from "../use-mutation-chat";
import { createTestChat } from "@/test/helpers";
import { createTestMessage } from "@/test/helpers";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  $chats.set([]);
  $messages.set([]);
});

describe("useMutationChat", () => {
  it("edit() updates the chat title", async () => {
    const chat = createTestChat({ _id: "c1", title: "Old Title" });
    $chats.set([chat]);

    const { result } = renderHook(() => useMutationChat("c1"));

    let success = false;
    await act(async () => {
      success = await result.current.edit({ title: "New Title" });
    });

    expect(success).toBe(true);
    expect($chats.get()[0].title).toBe("New Title");
  });

  it("delete() removes the chat and cascades to messages", async () => {
    const chat = createTestChat({ _id: "c1", title: "To Delete" });
    $chats.set([chat]);
    $messages.set([
      createTestMessage({ _id: "m1", chatId: "c1" }),
      createTestMessage({ _id: "m2", chatId: "c1" }),
      createTestMessage({ _id: "m3", chatId: "other" }),
    ]);

    const { result } = renderHook(() => useMutationChat("c1"));

    let success = false;
    await act(async () => {
      success = await result.current.delete();
    });

    expect(success).toBe(true);
    expect($chats.get()).toHaveLength(0);
    expect($messages.get()).toHaveLength(1);
    expect($messages.get()[0]._id).toBe("m3");
  });
});
