import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import type { AuthFlow, AuthStep } from "@/auth/types/auth";

// Must match convex/errors.ts — cannot share import across Convex/frontend boundary
const INVALID_PASSWORD = "INVALID_PASSWORD";

function friendlyAuthError(err: unknown, flow: AuthFlow): string {
  if (err instanceof ConvexError && err.data === INVALID_PASSWORD) {
    return "Password does not meet requirements";
  }
  const message = err instanceof Error ? err.message : "";
  if (
    message.includes("InvalidAccountId") ||
    message.includes("InvalidSecret")
  ) {
    return "Invalid email or password";
  }
  if (
    message.includes("AccountAlreadyExists") ||
    message.includes("already exists")
  ) {
    return "An account with this email already exists";
  }
  return flow === "signIn"
    ? "Could not sign in. Please try again."
    : "Could not create account. Please try again.";
}

export function useAuth() {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<AuthStep>("signIn");

  const handleAuth = async (
    flow: AuthFlow,
    email: string,
    password: string,
  ) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", flow);
      await signIn("password", formData);
      if (flow === "signUp") {
        setStep({ email });
      }
    } catch (err) {
      toast.error(friendlyAuthError(err, flow));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (email: string, code: string) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", code);
      formData.set("flow", "email-verification");
      await signIn("password", formData);
    } catch {
      toast.error("Invalid or expired code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async (
    email: string,
  ): Promise<string | null> => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("flow", "reset");
      await signIn("password", formData);
      return email;
    } catch {
      toast.error("Could not send reset code. Please try again.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", code);
      formData.set("newPassword", newPassword);
      formData.set("flow", "reset-verification");
      await signIn("password", formData);
    } catch (err) {
      if (err instanceof ConvexError && err.data === INVALID_PASSWORD) {
        toast.error("Password does not meet requirements");
      } else {
        toast.error("Could not reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn("anonymous");
    } catch {
      toast.error("Could not sign in as guest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleAuth,
    handleVerifyCode,
    handleRequestPasswordReset,
    handleResetPassword,
    handleAnonymousSignIn,
    isSubmitting,
    step,
    setStep,
  };
}
