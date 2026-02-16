import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import type { Theme } from "@/types/theme";

const DEBUG = false;

function decodeTheme(value: string): Theme {
  try {
    const parsed = JSON.parse(value);
    if (parsed === "dark" || parsed === "light" || parsed === "system") {
      return parsed;
    }
  } catch {
    // Fallback to default theme for malformed localStorage values.
  }

  return "system";
}

export const $theme = persistentAtom<Theme>("theme", "system", {
  encode: JSON.stringify,
  decode: decodeTheme,
});

export function setTheme(newTheme: Theme) {
  $theme.set(newTheme);
}

if (DEBUG) {
  logger({ $theme });
}
