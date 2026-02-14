import { toast } from "sonner";

import type { CreateChatType } from "@/chats/types/chat";
import { addChat } from "../store/chat";

export function useMutationChats() {

  const createChat = async (chat: CreateChatType): Promise<string | null> => {
    try {
      const chatId = crypto.randomUUID(); // Simulated chat ID
      addChat({
        ...chat,
        _id: chatId,
        _creationTime: Date.now(),
      });

      toast.success("Chat created successfully");
      return chatId;
    } catch (error) {
      toast.error("Error creating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createChat,
  };
}
