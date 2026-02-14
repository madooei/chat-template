import type { MessageType } from "@/messages/types/message";
import { useStore } from "@nanostores/react";
import { $messages } from "@/messages/store/message";

export function useQueryMessage(messageId: string) {
  const messages = useStore($messages);
  const message = messages.find((m) => m._id === messageId);

  return {
    data: message as MessageType,
    loading: false,
    error: false,
  };
}
