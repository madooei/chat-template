import "@/styles/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster richColors position="top-center" />
  </StrictMode>,
);
