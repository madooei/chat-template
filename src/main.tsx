import "@/styles/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { chatsHydrated } from "@/chats/store/chat";
import { messagesHydrated } from "@/messages/store/message";
import App from "./App.tsx";

async function main() {
  await Promise.all([chatsHydrated, messagesHydrated]);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      <Toaster richColors position="top-center" />
    </StrictMode>,
  );
}

main();
