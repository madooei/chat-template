import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import type { SettingsType } from "@/settings/types/settings";

const DEBUG = false;

const defaultSettings: SettingsType = {
  displayName: "",
  geminiApiKey: "",
};

export const $settings = persistentAtom<SettingsType>(
  "settings",
  defaultSettings,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export function updateSettings(updates: Partial<SettingsType>) {
  $settings.set({ ...$settings.get(), ...updates });
}

export function getSettings(): SettingsType {
  return $settings.get();
}

if (DEBUG) {
  logger({ $settings });
}
