import { logger } from "@nanostores/logger";
import { persistentAtom } from "@nanostores/persistent";
import type { ChatType } from "@/chats/types/chat";

const DEBUG = false;

export const $chats = persistentAtom<ChatType[]>("chats", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
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
