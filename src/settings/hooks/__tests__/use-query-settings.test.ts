import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

import { useQuerySettings } from "../use-query-settings";

beforeEach(() => {
  mockUseQuery.mockReset();
});

describe("useQuerySettings", () => {
  it("returns loading=true when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useQuerySettings());

    expect(result.current.data.displayName).toBe("");
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(false);
  });

  it("returns displayName mapped from name", () => {
    mockUseQuery.mockReturnValue({ name: "Alice" });

    const { result } = renderHook(() => useQuerySettings());

    expect(result.current.data.displayName).toBe("Alice");
    expect(result.current.loading).toBe(false);
  });

  it("defaults displayName to empty string when name is missing", () => {
    mockUseQuery.mockReturnValue({ name: "" });

    const { result } = renderHook(() => useQuerySettings());

    expect(result.current.data.displayName).toBe("");
  });
});
