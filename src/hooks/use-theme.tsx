import { $theme, setTheme } from "@/store/theme";
import { useStore } from "@nanostores/react";

export const useTheme = () => {
  const theme = useStore($theme);

  return {
    theme,
    setTheme,
  };
};
