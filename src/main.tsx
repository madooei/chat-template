import "@/styles/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Toaster } from "@/components/ui/sonner";
import { convex } from "@/lib/convex";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
      <Toaster richColors position="top-center" />
    </ConvexAuthProvider>
  </StrictMode>,
);
