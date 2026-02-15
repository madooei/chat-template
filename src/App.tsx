import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";
import { $router } from "@/app/router";
import ListChatsPage from "@/chats/pages/list-chats-page";
import AddChatPage from "@/chats/pages/add-chat-page";
import EditChatPage from "@/chats/pages/edit-chat-page";
import MessagesPage from "@/messages/pages/messages-page";
import SettingsPage from "@/settings/pages/settings-page";

function App() {
  const { theme } = useTheme();
  const page = useStore($router);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const activeChatId =
    page?.route === "editChat" || page?.route === "messages"
      ? page.params.id
      : undefined;

  let middle: React.ReactNode;
  if (page?.route === "settings") {
    middle = <SettingsPage />;
  } else if (page?.route === "addChat") {
    middle = <AddChatPage />;
  } else if (page?.route === "messages") {
    middle = <MessagesPage chatId={page.params.id} />;
  } else if (page?.route === "editChat") {
    middle = <EditChatPage chatId={page.params.id} />;
  } else {
    middle = (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a chat or create a new one.
      </div>
    );
  }

  return (
    <Layout
      leftPanelContent={<ListChatsPage activeChatId={activeChatId} />}
      middlePanelContent={middle}
      rightPanelContent={null}
      className={"h-screen"}
    />
  );
}

export default App;
