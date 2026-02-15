# Hook Patterns

The four hook patterns used in this codebase, with complete real examples.

## Pattern 1: Query Collection

Lists all items, or filters by a parent ID. Returns `{ data, loading, error }`.

### Example: `useQueryChats` — list all chats

```typescript
// src/chats/hooks/use-query-chats.ts

import type { ChatType } from "@/chats/types/chat";
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChats() {
  const chats = useStore($chats);

  return {
    data: chats as ChatType[],
    loading: false,
    error: false,
  };
}
```

### Example: `useQueryMessages` — filter messages by chatId

```typescript
// src/messages/hooks/use-query-messages.ts

import type { MessageType } from "@/messages/types/message";
import { useStore } from "@nanostores/react";
import { $messages } from "@/messages/store/message";

export function useQueryMessages(chatId: string) {
  const messages = useStore($messages);
  const filtered = messages.filter((m) => m.chatId === chatId);

  return {
    data: filtered as MessageType[],
    loading: false,
    error: false,
  };
}
```

**Key points:**

- Takes a parent ID when filtering a child resource (messages belong to a chat)
- `useStore` subscribes to the atom — component re-renders when data changes
- `loading` and `error` are always `false` with localStorage, but included for API compatibility

## Pattern 2: Query Single

Finds one item by ID. Returns `{ data, loading, error }`.

### Example: `useQueryChat` — get one chat

```typescript
// src/chats/hooks/use-query-chat.ts

import type { ChatType } from "@/chats/types/chat";
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";

export function useQueryChat(chatId: string) {
  const chats = useStore($chats);
  const chat = chats.find((c) => c._id === chatId);

  return {
    data: chat as ChatType,
    loading: false,
    error: false,
  };
}
```

**Key points:**

- Takes an `_id` and uses `.find()` to locate the item
- `data` will be `undefined` if the item doesn't exist — components should handle this

## Pattern 3: Mutation Collection

Creates a new item. Returns `{ add }`. The `add` function generates `_id` and `_creationTime`, calls the store, shows a toast, and returns the new ID.

### Example: `useMutationChats` — create a chat

```typescript
// src/chats/hooks/use-mutation-chats.ts

import { toast } from "sonner";
import type { CreateChatType } from "@/chats/types/chat";
import { addChat } from "../store/chat";

export function useMutationChats() {
  const createChat = async (chat: CreateChatType): Promise<string | null> => {
    try {
      const chatId = crypto.randomUUID();
      addChat({
        ...chat,
        _id: chatId,
        _creationTime: Date.now(),
      });

      toast.success("Chat created successfully");
      return chatId;
    } catch (error) {
      toast.error("Error creating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createChat,
  };
}
```

**Key points:**

- `_id` is generated with `crypto.randomUUID()` — universally unique, no collisions
- `_creationTime` is `Date.now()` — millisecond timestamp
- The function is `async` even though localStorage is synchronous — forward-compatible with real backends
- Returns the new ID on success, `null` on failure
- Toasts provide user feedback

## Pattern 4: Mutation Single

Updates or deletes an existing item. Takes the item's ID, returns `{ edit, delete }`.

### Example: `useMutationChat` — update/delete a chat

```typescript
// src/chats/hooks/use-mutation-chat.ts

import { toast } from "sonner";
import type { UpdateChatType } from "@/chats/types/chat";
import { useQueryChat } from "./use-query-chat";
import { updateChat, removeChat } from "@/chats/store/chat";
import { removeMessagesByChatId } from "@/messages/store/message";

export function useMutationChat(chatId: string) {
  const { data: chat } = useQueryChat(chatId);

  const editChat = async (updates: UpdateChatType): Promise<boolean> => {
    try {
      if (!chat) return false;
      updateChat({ ...chat, ...updates });
      toast.success("Chat updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      removeMessagesByChatId(chatId);
      removeChat(chatId);
      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting chat", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editChat,
    delete: deleteChat,
  };
}
```

**Key points:**

- Uses `useQueryChat` internally to get the current item (needed for merge-updating)
- `edit` merges updates with the existing item using spread: `{ ...chat, ...updates }`
- `delete` handles cascade deletes (removes messages before removing the chat)
- Both return `boolean` — `true` on success, `false` on failure
- Pages use the return value to decide navigation (e.g., navigate home after successful delete)

## Summary Table

| Pattern             | Takes           | Returns                      | Store Functions Used               |
| ------------------- | --------------- | ---------------------------- | ---------------------------------- |
| Query Collection    | optional filter | `{ data[], loading, error }` | `useStore($atom)`                  |
| Query Single        | `_id`           | `{ data, loading, error }`   | `useStore($atom)` + find           |
| Mutation Collection | nothing         | `{ add }`                    | `addEntity()`                      |
| Mutation Single     | `_id`           | `{ edit, delete }`           | `updateEntity()`, `removeEntity()` |
