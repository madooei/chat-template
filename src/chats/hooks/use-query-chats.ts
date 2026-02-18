import type { ChatType } from "@/chats/types/chat";
import { useSelector } from "@legendapp/state/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChats() {
  const chats = useSelector(() => $chats.get());

  return {
    data: chats as ChatType[],
    loading: false,
    error: false,
    status: "success",
    loadMore: () => {},
  };
}
