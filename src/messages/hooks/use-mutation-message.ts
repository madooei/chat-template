import { toast } from "sonner";

import type { UpdateMessageType } from "@/messages/types/message";
import { useQueryMessage } from "./use-query-message";
import { updateMessage, removeMessage } from "@/messages/store/message";

export function useMutationMessage(messageId: string) {
  const { data: message } = useQueryMessage(messageId);

  const editMessage = async (updates: UpdateMessageType): Promise<boolean> => {
    try {
      if (!message) return false;
      updateMessage({ ...message, ...updates });
      toast.success("Message updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating message", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteMessage = async (): Promise<boolean> => {
    try {
      removeMessage(messageId);
      toast.success("Message deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting message", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editMessage,
    delete: deleteMessage,
  };
}
