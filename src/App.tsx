import { useEffect } from "react";
import Layout from "@/layout";
import { useTheme } from "@/hooks/use-theme";

function App() {
  const { theme } = useTheme();

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

  const { left, middle, right } = {
    left: <>Hello left!</>,
    middle: <>Hello middle!</>,
    right: <>Hello right!</>,
  };

  return (
    <Layout
      leftPanelContent={left}
      middlePanelContent={middle}
      rightPanelContent={right}
      className={"h-screen"}
    />
  );
}

export default App;
