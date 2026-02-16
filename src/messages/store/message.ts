import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import { messageSchema, type MessageType } from "@/messages/types/message";

const DEBUG = false;

function decodeMessages(value: string): MessageType[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.reduce<MessageType[]>((acc, item) => {
      const result = messageSchema.safeParse(item);
      if (result.success) {
        acc.push(result.data);
      }
      return acc;
    }, []);
  } catch {
    // Fallback to empty list for malformed localStorage values.
    return [];
  }
}

export const $messages = persistentAtom<MessageType[]>("messages", [], {
  encode: JSON.stringify,
  decode: decodeMessages,
});

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

if (DEBUG) {
  logger({ $messages });
}
