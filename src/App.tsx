import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";
import ListChatsPage from "@/chats/pages/list-chats-page";
import MessagesPage from "@/messages/pages/messages-page";
import HomeEmptyState from "@/components/home-empty-state";

function App() {
  const { theme } = useTheme();
  const [location] = useLocation();

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

  const chatIdMatch = location.match(/^\/chats\/([^/]+)\/messages$/);
  const activeChatId = chatIdMatch ? chatIdMatch[1] : undefined;

  return (
    <Layout
      sidebar={<ListChatsPage activeChatId={activeChatId} />}
      content={
        <Switch>
          <Route path="/chats/:id/messages">
            {(params) => <MessagesPage key={params.id} chatId={params.id} />}
          </Route>
          <Route>
            <HomeEmptyState />
          </Route>
        </Switch>
      }
      className="h-screen"
    />
  );
}

export default App;
