import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";
import { $router } from "@/app/router";
import ListChatsPage from "@/chats/pages/list-chats-page";
import MessagesPage from "@/messages/pages/messages-page";
import HomeEmptyState from "@/components/home-empty-state";

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

  const activeChatId = page?.route === "messages" ? page.params.id : undefined;

  const renderContent = () => {
    switch (page?.route) {
      case "messages":
        return <MessagesPage chatId={page.params.id} />;
      default:
        return <HomeEmptyState />;
    }
  };

  return (
    <Layout
      sidebar={<ListChatsPage activeChatId={activeChatId} />}
      content={renderContent()}
      className="h-screen"
    />
  );
}

export default App;
