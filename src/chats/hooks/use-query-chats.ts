import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ChatType } from "@/chats/types/chat";

export function useQueryChats() {
  const chats = useQuery(api.chats_queries.getAll) as ChatType[] | undefined;

  return {
    data: chats ?? [],
    loading: chats === undefined,
    error: false,
  };
}
