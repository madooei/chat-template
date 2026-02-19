import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ChatType } from "@/chats/types/chat";

export function useQueryChat(chatId: string) {
  const chat = useQuery(api.chats_queries.getOne, {
    chatId: chatId as Id<"chats">,
  }) as ChatType | null | undefined;

  return {
    data: chat ?? undefined,
    loading: chat === undefined,
    error: false,
  };
}
