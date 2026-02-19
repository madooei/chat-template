import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useMutationChat(chatId: string) {
  const updateMutation = useMutation(api.chats_mutations.update);
  const removeMutation = useMutation(api.chats_mutations.remove);

  const editChat = async (updates: { title?: string }): Promise<boolean> => {
    try {
      await updateMutation({
        chatId: chatId as Id<"chats">,
        ...updates,
      });
      toast.success("Chat updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      await removeMutation({ chatId: chatId as Id<"chats"> });
      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editChat,
    delete: deleteChat,
  };
}
