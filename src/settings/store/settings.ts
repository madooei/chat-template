import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import { settingsSchema, type SettingsType } from "@/settings/types/settings";

const DEBUG = false;

const defaultSettings: SettingsType = {
  displayName: "",
  geminiApiKey: "",
};

export function decodeSettings(value: string): SettingsType {
  try {
    const parsed = JSON.parse(value);
    const result = settingsSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Fallback to defaults for malformed localStorage values.
  }

  return defaultSettings;
}

export const $settings = persistentAtom<SettingsType>(
  "settings",
  defaultSettings,
  {
    encode: JSON.stringify,
    decode: decodeSettings,
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
