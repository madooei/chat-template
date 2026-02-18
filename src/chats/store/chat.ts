import { createPersistedIdbObservable } from "@/store/persisted-idb-observable";
import { chatSchema, type ChatType } from "@/chats/types/chat";

export function decodeChats(value: unknown): ChatType[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<ChatType[]>((acc, item) => {
    const result = chatSchema.safeParse(item);
    if (result.success) {
      acc.push(result.data);
    }
    return acc;
  }, []);
}

const { obs, hydrated } = createPersistedIdbObservable<ChatType[]>(
  "chats",
  "data",
  [],
  decodeChats,
);
export const $chats = obs;
export const chatsHydrated = hydrated;

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
