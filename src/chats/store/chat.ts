import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import { chatSchema, type ChatType } from "@/chats/types/chat";

const DEBUG = false;

export function decodeChats(value: string): ChatType[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.reduce<ChatType[]>((acc, item) => {
      const result = chatSchema.safeParse(item);
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

export const $chats = persistentAtom<ChatType[]>("chats", [], {
  encode: JSON.stringify,
  decode: decodeChats,
});

export function addChat(newChat: ChatType) {
  $chats.set([...$chats.get(), newChat]);
}

export function setChats(chats: ChatType[]) {
  $chats.set(chats);
}

export function updateChat(updatedChat: ChatType) {
  const chats = $chats
    .get()
    .map((chat) => (chat._id === updatedChat._id ? updatedChat : chat));
  $chats.set(chats);
}

export function removeChat(chatId: string) {
  const chats = $chats.get().filter((chat) => chat._id !== chatId);
  $chats.set(chats);
}

export function clearChats() {
  $chats.set([]);
}

if (DEBUG) {
  logger({ $chats });
}
