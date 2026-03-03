import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { ConvexError } from "convex/values";

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

    it("maps ConvexError INVALID_PASSWORD to friendly message", async () => {
      mockSignIn.mockRejectedValue(new ConvexError("INVALID_PASSWORD"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signUp", "a@b.com", "weak");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Password does not meet requirements",
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

    it("sets step to email object on signUp success", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signUp", "a@b.com", "password1");
      });

      expect(result.current.step).toEqual({ email: "a@b.com" });
    });

    it("does not change step on signIn success", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(result.current.step).toBe("signIn");
    });

    it("does not change step on error", async () => {
      mockSignIn.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleAuth("signIn", "a@b.com", "password1");
      });

      expect(result.current.step).toBe("signIn");
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

  describe("handleVerifyCode", () => {
    it("calls signIn with email-verification flow and code", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleVerifyCode("a@b.com", "12345678");
      });

      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
      const formData = mockSignIn.mock.calls[0][1] as FormData;
      expect(formData.get("email")).toBe("a@b.com");
      expect(formData.get("code")).toBe("12345678");
      expect(formData.get("flow")).toBe("email-verification");
    });

    it("shows error toast on failure", async () => {
      mockSignIn.mockRejectedValue(new Error("invalid code"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleVerifyCode("a@b.com", "00000000");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Invalid or expired code. Please try again.",
      );
    });
  });

  describe("handleRequestPasswordReset", () => {
    it("calls signIn with reset flow and returns email on success", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      let returnValue: string | null = null;
      await act(async () => {
        returnValue =
          await result.current.handleRequestPasswordReset("a@b.com");
      });

      expect(returnValue).toBe("a@b.com");
      const formData = mockSignIn.mock.calls[0][1] as FormData;
      expect(formData.get("email")).toBe("a@b.com");
      expect(formData.get("flow")).toBe("reset");
    });

    it("returns null and shows toast on failure", async () => {
      mockSignIn.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() => useAuth());

      let returnValue: string | null = "not-null";
      await act(async () => {
        returnValue =
          await result.current.handleRequestPasswordReset("a@b.com");
      });

      expect(returnValue).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        "Could not send reset code. Please try again.",
      );
    });
  });

  describe("handleResetPassword", () => {
    it("calls signIn with reset-verification flow", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleResetPassword(
          "a@b.com",
          "12345678",
          "NewPass1!",
        );
      });

      const formData = mockSignIn.mock.calls[0][1] as FormData;
      expect(formData.get("email")).toBe("a@b.com");
      expect(formData.get("code")).toBe("12345678");
      expect(formData.get("newPassword")).toBe("NewPass1!");
      expect(formData.get("flow")).toBe("reset-verification");
    });

    it("shows INVALID_PASSWORD toast for ConvexError", async () => {
      mockSignIn.mockRejectedValue(new ConvexError("INVALID_PASSWORD"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleResetPassword("a@b.com", "12345678", "weak");
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Password does not meet requirements",
      );
    });

    it("shows generic error toast for other failures", async () => {
      mockSignIn.mockRejectedValue(new Error("unknown"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleResetPassword(
          "a@b.com",
          "12345678",
          "NewPass1!",
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Could not reset password. Please try again.",
      );
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

  describe("step state", () => {
    it("starts with signIn step", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.step).toBe("signIn");
    });

    it("can be set via setStep", () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setStep("forgot");
      });

      expect(result.current.step).toBe("forgot");
    });
  });
});
