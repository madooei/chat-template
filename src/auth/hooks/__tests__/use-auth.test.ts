import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

const mockSignIn = vi.fn();
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { useAuth } from "../use-auth";
import { toast } from "sonner";

beforeEach(() => {
  mockSignIn.mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("useAuth", () => {
  describe("friendlyAuthError mapping", () => {
    it("maps InvalidAccountId to friendly message", async () => {
      mockSignIn.mockRejectedValue(new Error("InvalidAccountId"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });

    it("maps InvalidSecret to friendly message", async () => {
      mockSignIn.mockRejectedValue(new Error("InvalidSecret"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });

    it("maps AccountAlreadyExists to friendly message", async () => {
      mockSignIn.mockRejectedValue(new Error("AccountAlreadyExists"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signUp", "a@b.com", "password1");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "An account with this email already exists",
      );
    });

    it("uses generic signIn message for unknown errors", async () => {
      mockSignIn.mockRejectedValue(new Error("Something unexpected"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Could not sign in. Please try again.",
      );
    });

    it("uses generic signUp message for unknown errors", async () => {
      mockSignIn.mockRejectedValue(new Error("Something unexpected"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signUp", "a@b.com", "password1");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Could not create account. Please try again.",
      );
    });
  });

  describe("handleAuth", () => {
    it("calls signIn with password provider and form data", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
      const formData = mockSignIn.mock.calls[0][1] as FormData;
      expect(formData.get("email")).toBe("a@b.com");
      expect(formData.get("password")).toBe("password1");
      expect(formData.get("flow")).toBe("signIn");
    });

    it("sets isSubmitting during the async operation", async () => {
      let resolveSignIn!: () => void;
      mockSignIn.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
      );
      const { result } = renderHook(() => useAuth());

      expect(result.current.isSubmitting).toBe(false);

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSignIn();
        await promise!;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("handleAnonymousSignIn", () => {
    it("calls signIn with anonymous provider", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAnonymousSignIn();
      });

      expect(mockSignIn).toHaveBeenCalledWith("anonymous");
    });

    it("shows error toast on failure", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAnonymousSignIn();
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Could not sign in as guest. Please try again.",
      );
    });

    it("sets isSubmitting during the async operation", async () => {
      let resolveSignIn!: () => void;
      mockSignIn.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
      );
      const { result } = renderHook(() => useAuth());

      expect(result.current.isSubmitting).toBe(false);

      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleAnonymousSignIn();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSignIn();
        await promise!;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
