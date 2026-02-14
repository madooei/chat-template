import { toast } from "sonner";

import type { UpdateChatType } from "@/chats/types/chat";
import { useQueryChat } from "./use-query-chat";
import { updateChat, removeChat } from "@/chats/store/chat";
import { removeMessagesByChatId } from "@/messages/store/message";

export function useMutationChat(chatId: string) {
  const { data: chat } = useQueryChat(chatId);

  const editChat = async (updates: UpdateChatType): Promise<boolean> => {
    try {
      if (!chat) return false;
      updateChat({ ...chat, ...updates });
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
      removeMessagesByChatId(chatId);
      removeChat(chatId);
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
