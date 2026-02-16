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
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedTheme =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (theme !== "system") return;

    const handleChange = () => applyTheme();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const activeChatId = page?.route === "messages" ? page.params.id : undefined;

  const renderContent = () => {
    switch (page?.route) {
      case "messages":
        return <MessagesPage key={page.params.id} chatId={page.params.id} />;
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
