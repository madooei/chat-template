import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import { useTheme } from "@/hooks/use-theme";

interface MarkdownProps {
  content: string;
}

function resolveTheme(theme: string): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const { theme } = useTheme();
  const resolvedTheme = resolveTheme(theme);

  return (
    <div
      data-color-mode={resolvedTheme}
      className="w-full max-w-full min-w-0"
    >
      <MarkdownPreview
        source={content}
        style={{
          backgroundColor: "transparent",
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
      />
    </div>
  );
};

export default Markdown;
