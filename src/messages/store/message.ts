import { createPersistedIdbObservable } from "@/store/persisted-idb-observable";
import { messageSchema, type MessageType } from "@/messages/types/message";

export function decodeMessages(value: unknown): MessageType[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<MessageType[]>((acc, item) => {
    const result = messageSchema.safeParse(item);
    if (result.success) {
      acc.push(result.data);
    }
    return acc;
  }, []);
}

const { obs, hydrated } = createPersistedIdbObservable<MessageType[]>(
  "messages",
  "data",
  [],
  decodeMessages,
);
export const $messages = obs;
export const messagesHydrated = hydrated;

export function addMessage(newMessage: MessageType) {
  $messages.set([...$messages.get(), newMessage]);
}

export function updateMessage(updatedMessage: MessageType) {
  const messages = $messages
    .get()
    .map((message) =>
      message._id === updatedMessage._id ? updatedMessage : message,
    );
  $messages.set(messages);
}

export function removeMessage(messageId: string) {
  const messages = $messages
    .get()
    .filter((message) => message._id !== messageId);
  $messages.set(messages);
}

export function removeMessagesByChatId(chatId: string) {
  const messages = $messages
    .get()
    .filter((message) => message.chatId !== chatId);
  $messages.set(messages);
}

export function clearMessages() {
  $messages.set([]);
}
