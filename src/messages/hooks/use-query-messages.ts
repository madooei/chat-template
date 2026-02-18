import type { MessageType } from "@/messages/types/message";
import { useSelector } from "@legendapp/state/react";
import { $messages } from "@/messages/store/message";

export function useQueryMessages(chatId: string) {
  const filtered = useSelector(() =>
    $messages.get().filter((m) => m.chatId === chatId),
  );

  return {
    data: filtered as MessageType[],
    loading: false,
    error: false,
  };
}
