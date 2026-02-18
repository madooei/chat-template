import type { MessageType } from "@/messages/types/message";
import { useSelector } from "@legendapp/state/react";
import { $messages } from "@/messages/store/message";

export function useQueryMessage(messageId: string) {
  const message = useSelector(() =>
    $messages.get().find((m) => m._id === messageId),
  );

  return {
    data: message as MessageType,
    loading: false,
    error: false,
  };
}
