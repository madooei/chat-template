import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import type { Theme } from "@/types/theme";

const DEBUG = false;

export const $theme = persistentAtom<Theme>("theme", "system", {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function setTheme(newTheme: Theme) {
  $theme.set(newTheme);
}

if (DEBUG) {
  logger({ $theme });
}
