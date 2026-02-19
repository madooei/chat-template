import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MessageType } from "@/messages/types/message";

export function useQueryMessages(chatId: string) {
  const messages = useQuery(api.messages_queries.getByChat, {
    chatId: chatId as Id<"chats">,
  }) as MessageType[] | undefined;

  return {
    data: messages ?? [],
    loading: messages === undefined,
    error: false,
  };
}
