import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";
import { useWindowSize } from "@/hooks/use-window-size";
import { $router } from "@/app/router";
import ListChatsPage from "@/chats/pages/list-chats-page";
import MessagesPage from "@/messages/pages/messages-page";
import SettingsPage from "@/settings/pages/settings-page";

function App() {
  const { theme } = useTheme();
  const page = useStore($router);
  const size = useWindowSize();
  const isSmallScreen = size.width ? size.width <= 720 : false;

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

  const activeChatId = page?.route === "messages" ? page.params.id : undefined;

  const renderContent = () => {
    switch (page?.route) {
      case "settings":
        return {
          left: isSmallScreen ? null : (
            <ListChatsPage activeChatId={activeChatId} />
          ),
          middle: <SettingsPage />,
        };
      case "messages":
        return {
          left: isSmallScreen ? null : (
            <ListChatsPage activeChatId={activeChatId} />
          ),
          middle: <MessagesPage chatId={page.params.id} />,
        };
      default:
        return {
          left: <ListChatsPage activeChatId={activeChatId} />,
          middle: isSmallScreen ? null : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a chat or create a new one.
            </div>
          ),
        };
    }
  };

  const { left, middle } = renderContent();

  return (
    <Layout
      leftPanelContent={left}
      middlePanelContent={middle}
      rightPanelContent={null}
      className={"h-screen"}
    />
  );
}

export default App;
