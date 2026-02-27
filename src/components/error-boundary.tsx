import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Fallback UI shown when Sentry's ErrorBoundary catches an error.
 * This is a pure presentational component — Sentry handles the
 * error capture and reporting automatically.
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error: unknown;
  resetError: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  const handleReset = () => {
    resetError();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        <Button variant="outline" onClick={handleReset}>
          Return home
        </Button>
      </div>
    </div>
  );
}
