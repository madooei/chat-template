import { useStore } from "@nanostores/react";
import { $settings } from "@/settings/store/settings";

export function useQuerySettings() {
  const settings = useStore($settings);

  return {
    data: settings,
    loading: false,
    error: false,
  };
}
