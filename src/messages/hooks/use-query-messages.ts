import type { MessageType } from "@/messages/types/message";
import { useStore } from "@nanostores/react";
import { $messages } from "@/messages/store/message";

export function useQueryMessages(chatId: string) {
  const messages = useStore($messages);
  const filtered = messages.filter((m) => m.chatId === chatId);

  return {
    data: filtered as MessageType[],
    loading: false,
    error: false,
  };
}
