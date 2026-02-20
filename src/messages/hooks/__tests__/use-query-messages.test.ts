import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { createTestMessage } from "@/test/helpers";

const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@legendapp/state/react", () => ({
  useSelector: (fn: () => unknown) => fn(),
}));

const mockSyncPersistedMessages = vi.fn();
const mockGetMergedMessages = vi.fn().mockReturnValue([]);
const mockDisposeChatMessages = vi.fn();

vi.mock("@/messages/store/messages", () => ({
  syncPersistedMessages: (...args: unknown[]) =>
    mockSyncPersistedMessages(...args),
  getMergedMessages: (...args: unknown[]) => mockGetMergedMessages(...args),
  disposeChatMessages: (...args: unknown[]) =>
    mockDisposeChatMessages(...args),
}));

import { useQueryMessages } from "../use-query-messages";

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReset();
  mockGetMergedMessages.mockReturnValue([]);
});

describe("useQueryMessages", () => {
  it("returns empty array and loading when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("syncs persisted messages when query resolves", () => {
    const messages = [
      createTestMessage({ _id: "m1", chatId: "chat-a", content: "Hello" }),
      createTestMessage({ _id: "m2", chatId: "chat-a", content: "World" }),
    ];
    mockUseQuery.mockReturnValue(messages);
    mockGetMergedMessages.mockReturnValue(messages);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(mockSyncPersistedMessages).toHaveBeenCalledWith("chat-a", messages);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it("returns merged messages from store", () => {
    const persisted = [
      createTestMessage({ _id: "m1", chatId: "chat-a", content: "Hello" }),
    ];
    const optimistic = createTestMessage({
      _id: "opt-1",
      chatId: "chat-a",
      content: "Optimistic",
      _creationTime: Date.now(),
    });

    mockUseQuery.mockReturnValue(persisted);
    mockGetMergedMessages.mockReturnValue([...persisted, optimistic]);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(result.current.data).toHaveLength(2);
  });
});
