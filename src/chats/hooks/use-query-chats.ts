import type { ChatType } from "@/chats/types/chat";
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChats() {
  const chats = useStore($chats);

  return {
    data: chats as ChatType[],
    loading: false,
    error: false,
    status: "success",
    loadMore: () => {},
  };
}
