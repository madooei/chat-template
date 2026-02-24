import { useEffect } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Switch, Route, useLocation } from "wouter";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";
import { useAutoSignIn } from "@/hooks/use-auto-sign-in";
import { AUTH_MODE } from "@/config/env";
import ListChatsPage from "@/chats/pages/list-chats-page";
import MessagesPage from "@/messages/pages/messages-page";
import HomeEmptyState from "@/components/home-empty-state";
import NotFoundPage from "@/components/not-found-page";
import AuthPage from "@/auth/pages/auth-page";

function CatchAllRoute() {
  const [location] = useLocation();
  return location === "/" ? <HomeEmptyState /> : <NotFoundPage />;
}

function MainApp() {
  const [location] = useLocation();
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
            <CatchAllRoute />
          </Route>
        </Switch>
      }
      className="h-screen"
    />
  );
}

function AnonymousApp() {
  const { isLoading, error: authError } = useAutoSignIn();

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive text-sm">
          Failed to sign in. Please refresh the page.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return <MainApp />;
}

function PasswordApp() {
  return (
    <>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <AuthPage />
      </Unauthenticated>
      <Authenticated>
        <MainApp />
      </Authenticated>
    </>
  );
}

function App() {
  const { theme } = useTheme();

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

  return AUTH_MODE === "password" ? <PasswordApp /> : <AnonymousApp />;
}

export default App;
