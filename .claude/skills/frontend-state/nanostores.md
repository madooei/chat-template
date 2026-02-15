# Nanostores Patterns

Nanostores is a tiny (~1KB), framework-agnostic state manager. We use it for all global state in this project. It has two key packages:

- `nanostores` — core atoms and computed values
- `@nanostores/persistent` — atoms that auto-sync to localStorage
- `@nanostores/react` — the `useStore` hook for React integration

## Persistent Atom

This is our primary pattern. A `persistentAtom` automatically reads from and writes to localStorage:

```typescript
import { persistentAtom } from "@nanostores/persistent";
import type { MessageType } from "@/messages/types/message";

export const $messages = persistentAtom<MessageType[]>("messages", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});
```

- First argument: localStorage key (`"messages"`)
- Second argument: default value (`[]`)
- Third argument: serialization — always use `JSON.stringify`/`JSON.parse` for arrays and objects

Every `.set()` call automatically persists to localStorage. Every page load automatically hydrates from localStorage. No manual load/save code needed.

## Plain Atom

Use `atom` for global state that doesn't need to survive a page refresh:

```typescript
import { atom } from "nanostores";

export const $sidebarOpen = atom(false);
export const $currentStroke = atom<Stroke | null>(null);
```

## Naming Convention

Always prefix atom names with `$`. This visually distinguishes reactive state from plain variables:

```typescript
// ✅ Atoms prefixed with $
export const $chats = persistentAtom<ChatType[]>("chats", []);
export const $theme = persistentAtom<string>("theme", "system");

// ❌ No prefix — looks like a regular variable
export const chats = persistentAtom<ChatType[]>("chats", []);
```

## Actions

Actions are plain exported functions that mutate atoms. They're not methods on a class or store object — just functions:

```typescript
import { $messages } from "./message";

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
```

**Why plain functions?**

- Easy to import and call from anywhere (hooks, other stores, tests)
- No `this` binding issues
- Tree-shakeable — unused functions don't ship to the bundle
- Simple to understand — no store classes, no reducers, no dispatching

## Standard CRUD Functions

Every entity store exports the same set of functions:

| Function                 | Purpose                          |
| ------------------------ | -------------------------------- |
| `add{Entity}(entity)`    | Append a new entity to the array |
| `update{Entity}(entity)` | Replace an entity by `_id`       |
| `remove{Entity}(id)`     | Filter out an entity by `_id`    |
| `clear{Entities}()`      | Reset to empty array             |

Some stores add feature-specific functions like `removeMessagesByChatId` for cascade deletes.

## Using in React

Use the `useStore` hook from `@nanostores/react` to subscribe a component to an atom:

```typescript
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";

function ChatList() {
  const chats = useStore($chats);

  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat._id}>{chat.title}</li>
      ))}
    </ul>
  );
}
```

`useStore` subscribes to the atom and re-renders the component when the value changes. It's the nanostores equivalent of `useState`, but the state lives outside the component tree.

**Important:** In this codebase, components don't call `useStore` directly. Instead, they use custom hooks (`useQueryChats`, `useQueryMessages`) that wrap `useStore`. This keeps the abstraction boundary clean — see the frontend-hooks skill.

## Computed Values

Derive new values from existing atoms:

```typescript
import { computed } from "nanostores";
import { $messages } from "./message";

export const $messageCount = computed($messages, (messages) => messages.length);

export const $hasMessages = computed(
  $messages,
  (messages) => messages.length > 0,
);
```

Computed atoms update automatically when their source atoms change. Use them when multiple components need the same derived value.

## Debug Logging

Use `@nanostores/logger` behind a `DEBUG` flag during development:

```typescript
import { logger } from "@nanostores/logger";

const DEBUG = false;

export const $chats = persistentAtom<ChatType[]>("chats", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// ... actions ...

if (DEBUG) {
  logger({ $chats });
}
```

Set `DEBUG = true` to see every atom change in the console. Set it back to `false` before committing — it's a development-only tool.

## Store File Structure

A typical entity store is a single file with this layout:

```typescript
// 1. Imports
import { persistentAtom } from "@nanostores/persistent";
import { logger } from "@nanostores/logger";
import type { EntityType } from "../types/entity";

// 2. Debug flag
const DEBUG = false;

// 3. Atom definition
export const $entities = persistentAtom<EntityType[]>("entities", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// 4. CRUD functions
export function addEntity(entity: EntityType) { ... }
export function updateEntity(entity: EntityType) { ... }
export function removeEntity(id: string) { ... }
export function clearEntities() { ... }

// 5. Feature-specific functions (if any)
export function removeEntitiesByParentId(parentId: string) { ... }

// 6. Debug logging (last)
if (DEBUG) {
  logger({ $entities });
}
```

Keep it all in one file unless the store grows complex enough to warrant splitting. For most features, one file is enough.
