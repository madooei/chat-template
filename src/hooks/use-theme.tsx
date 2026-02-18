import { $theme, setTheme } from "@/store/theme";
import { useSelector } from "@legendapp/state/react";

export const useTheme = () => {
  const theme = useSelector($theme);

  return {
    theme,
    setTheme,
  };
};
