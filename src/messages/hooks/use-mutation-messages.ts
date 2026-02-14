import { toast } from "sonner";

import type { CreateMessageType } from "@/messages/types/message";
import { addMessage } from "@/messages/store/message";

export function useMutationMessages() {
  const createMessage = async (
    message: CreateMessageType,
  ): Promise<string | null> => {
    try {
      const messageId = crypto.randomUUID();
      addMessage({
        ...message,
        _id: messageId,
        _creationTime: Date.now(),
      });

      toast.success("Message created successfully");
      return messageId;
    } catch (error) {
      toast.error("Error creating message", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createMessage,
  };
}
