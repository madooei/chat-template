import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import type { AuthFlow } from "@/auth/types/auth";

function friendlyAuthError(err: unknown, flow: AuthFlow): string {
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
    } catch (err) {
      toast.error(friendlyAuthError(err, flow));
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

  return { handleAuth, handleAnonymousSignIn, isSubmitting };
}
