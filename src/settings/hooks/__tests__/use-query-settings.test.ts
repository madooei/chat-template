import { renderHook } from "@testing-library/react";
import { $settings } from "@/settings/store/settings";
import { useQuerySettings } from "../use-query-settings";

beforeEach(() => {
  $settings.set({ displayName: "", geminiApiKey: "" });
});

describe("useQuerySettings", () => {
  it("returns default values", () => {
    const { result } = renderHook(() => useQuerySettings());

    expect(result.current.data.displayName).toBe("");
    expect(result.current.data.geminiApiKey).toBe("");
    expect(result.current.loading).toBe(false);
  });

  it("returns updated values", () => {
    $settings.set({ displayName: "Alice", geminiApiKey: "key-123" });

    const { result } = renderHook(() => useQuerySettings());

    expect(result.current.data.displayName).toBe("Alice");
    expect(result.current.data.geminiApiKey).toBe("key-123");
  });
});
