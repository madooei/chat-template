import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

const mockUseMutation = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useMutationSettings } from "../use-mutation-settings";
import { toast } from "sonner";

beforeEach(() => {
  mockUseMutation.mockReset();
});

describe("useMutationSettings", () => {
  it("edit() calls updateMe mutation with mapped name", async () => {
    const mockUpdateMe = vi.fn().mockResolvedValue(null);
    mockUseMutation.mockReturnValue(mockUpdateMe);

    const { result } = renderHook(() => useMutationSettings());

    await act(async () => {
      await result.current.edit({ displayName: "Bob" });
    });

    expect(mockUpdateMe).toHaveBeenCalledWith({ name: "Bob" });
    expect(toast.success).toHaveBeenCalledWith("Settings saved successfully");
  });

  it("edit() shows error toast on failure", async () => {
    const mockUpdateMe = vi.fn().mockRejectedValue(new Error("Failed"));
    mockUseMutation.mockReturnValue(mockUpdateMe);

    const { result } = renderHook(() => useMutationSettings());

    await expect(
      act(async () => {
        await result.current.edit({ displayName: "Bad" });
      }),
    ).rejects.toThrow("Failed");

    expect(toast.error).toHaveBeenCalledWith("Error saving settings", {
      description: "Failed",
    });
  });

  it("edit() rethrows error after showing toast", async () => {
    const error = new Error("Failed");
    const mockUpdateMe = vi.fn().mockRejectedValue(error);
    mockUseMutation.mockReturnValue(mockUpdateMe);

    const { result } = renderHook(() => useMutationSettings());

    await expect(
      act(async () => {
        await result.current.edit({ displayName: "Bad" });
      }),
    ).rejects.toThrow("Failed");
  });
});
