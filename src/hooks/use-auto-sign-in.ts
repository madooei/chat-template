import { useState, useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Automatically sign in anonymously on first visit.
 * Returns { isLoading, isAuthenticated, error }.
 */
export function useAutoSignIn() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      signIn("anonymous").catch((err: unknown) => {
        setError(
          err instanceof Error ? err : new Error("Anonymous sign-in failed"),
        );
      });
    }
  }, [isLoading, isAuthenticated, signIn, error]);

  return {
    isLoading: !error && (isLoading || !isAuthenticated),
    isAuthenticated,
    error,
  };
}
