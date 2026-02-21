import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { createTestChat } from "@/test/helpers";

const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import { useQueryChats } from "../use-query-chats";

beforeEach(() => {
  mockUseQuery.mockReset();
});

describe("useQueryChats", () => {
  it("returns empty array and loading=true when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useQueryChats());

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(false);
  });

  it("returns chats when query resolves", () => {
    const chat1 = createTestChat({ _id: "c1", title: "First" });
    const chat2 = createTestChat({ _id: "c2", title: "Second" });
    mockUseQuery.mockReturnValue([chat1, chat2]);

    const { result } = renderHook(() => useQueryChats());

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe("First");
    expect(result.current.data[1].title).toBe("Second");
    expect(result.current.loading).toBe(false);
  });
});
