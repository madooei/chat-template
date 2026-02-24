import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { SettingsType } from "@/settings/types/settings";

export function useQuerySettings() {
  const result = useQuery(api.users_queries.getMe);

  const data: SettingsType = {
    displayName: result?.name ?? "",
  };

  return {
    data,
    loading: result === undefined,
    error: false,
  };
}
