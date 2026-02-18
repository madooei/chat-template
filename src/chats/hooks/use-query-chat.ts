import type { ChatType } from "@/chats/types/chat";
import { useSelector } from "@legendapp/state/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChat(chatId: string) {
  const chat = useSelector(() => $chats.get().find((c) => c._id === chatId));

  return {
    data: chat as ChatType,
    loading: false,
    error: false,
  };
}
