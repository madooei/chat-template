import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { UpdateSettingsType } from "@/settings/types/settings";

export function useMutationSettings() {
  const updateMe = useMutation(api.users_mutations.updateMe);

  const edit = async (updates: UpdateSettingsType) => {
    try {
      await updateMe({ name: updates.displayName });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Error saving settings", {
        description: (error as Error).message || "Please try again later",
      });
      throw error;
    }
  };

  return { edit };
}
