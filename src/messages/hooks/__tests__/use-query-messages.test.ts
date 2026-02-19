import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { createTestMessage } from "@/test/helpers";

const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import { useQueryMessages } from "../use-query-messages";

beforeEach(() => {
  mockUseQuery.mockReset();
});

describe("useQueryMessages", () => {
  it("returns empty array and loading when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("returns messages when query resolves", () => {
    const messages = [
      createTestMessage({ _id: "m1", chatId: "chat-a", content: "Hello" }),
      createTestMessage({ _id: "m2", chatId: "chat-a", content: "World" }),
    ];
    mockUseQuery.mockReturnValue(messages);

    const { result } = renderHook(() => useQueryMessages("chat-a"));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].content).toBe("Hello");
    expect(result.current.loading).toBe(false);
  });
});
