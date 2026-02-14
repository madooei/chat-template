import type { ChatType } from "@/chats/types/chat";
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChat(chatId: string) {
  const chats = useStore($chats);
  const chat = chats.find((c) => c._id === chatId);

  return {
    data: chat as ChatType,
    loading: false,
    error: false,
  };
}
