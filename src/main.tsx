import "@/styles/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Toaster } from "@/components/ui/sonner";
import { convex } from "@/lib/convex";
import { ErrorFallback } from "@/components/error-boundary";
import { SENTRY_DSN } from "@/config/env";
import App from "./App.tsx";

// Initialize Sentry before rendering — only active when DSN is configured
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

createRoot(document.getElementById("root")!, {
  // React 19 error hooks — forward all errors to Sentry automatically
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error("Uncaught error:", error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <ErrorFallback error={error} resetError={resetError} />
        )}
      >
        <App />
      </Sentry.ErrorBoundary>
      <Toaster richColors position="top-center" />
    </ConvexAuthProvider>
  </StrictMode>,
);
