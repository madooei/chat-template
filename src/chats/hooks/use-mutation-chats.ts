import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

export function useMutationChats() {
  const createMutation = useMutation(api.chats_mutations.create);

  const createChat = async (chat: {
    title: string;
  }): Promise<string | null> => {
    try {
      const chatId = await createMutation({ title: chat.title });
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
