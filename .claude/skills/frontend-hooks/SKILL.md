---
name: frontend-hooks
description: Patterns for writing React hooks in the frontend. Use when creating hooks for data access, implementing mutations with toasts, or asking about hook conventions, naming, and return shapes.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Frontend Hooks Guide

Patterns for writing React hooks in the frontend codebase.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (hooks live in `{feature}/hooks/`)
- **[frontend-types](../frontend-types/SKILL.md)** — Types that hooks consume
- **[frontend-state](../frontend-state/SKILL.md)** — Stores that hooks wrap

---

## Quick Reference

| Topic        | File                       | Description                               |
| ------------ | -------------------------- | ----------------------------------------- |
| **Patterns** | [patterns.md](patterns.md) | The four hook patterns with real examples |

---

## The Role of Hooks

Hooks are the bridge between the store layer and React components. They serve two purposes:

1. **Abstraction** — Components never import stores directly. They use hooks. This means you can change how data is stored without touching components.
2. **React integration** — Hooks use `useStore` to subscribe to nanostores atoms, triggering re-renders when data changes.

```plaintext
Store ($chats, addChat, ...)  →  Hook (useQueryChats)  →  Component (<ChatList>)
```

Hooks are intentionally thin. They don't contain business logic — they translate between the store's API and what React components need.

---

## Hook Location

Hooks live in their feature's `hooks/` directory:

```plaintext
src/
├── chats/hooks/
│   ├── use-query-chats.ts       # List all chats
│   ├── use-query-chat.ts        # Get single chat by ID
│   ├── use-mutation-chats.ts    # Create chat
│   └── use-mutation-chat.ts     # Update/delete chat
└── messages/hooks/
    ├── use-query-messages.ts    # List messages by chatId
    ├── use-query-message.ts     # Get single message by ID
    ├── use-mutation-messages.ts # Create message
    └── use-mutation-message.ts  # Update/delete message
```

---

## Two Hook Types

Every feature has two kinds of hooks: **query hooks** (read data) and **mutation hooks** (write data).

### Query Hooks

Query hooks subscribe to the store and return data. They always return `{ data, loading, error }`:

```typescript
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";
import type { ChatType } from "@/chats/types/chat";

export function useQueryChats() {
  const chats = useStore($chats);

  return {
    data: chats as ChatType[],
    loading: false,
    error: false,
  };
}
```

`loading` and `error` are always `false` with localStorage (reads are synchronous). But we include them in the return shape so that when you swap to a real backend (where reads are async and can fail), components don't need to change.

### Mutation Hooks

Mutation hooks return functions that modify data. They handle try/catch and show toasts:

```typescript
import { toast } from "sonner";
import type { CreateChatType } from "@/chats/types/chat";
import { addChat } from "../store/chat";

export function useMutationChats() {
  const createChat = async (chat: CreateChatType): Promise<string | null> => {
    try {
      const chatId = crypto.randomUUID();
      addChat({ ...chat, _id: chatId, _creationTime: Date.now() });
      toast.success("Chat created successfully");
      return chatId;
    } catch (error) {
      toast.error("Error creating chat", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return { add: createChat };
}
```

Mutation hooks are `async` even though localStorage writes are synchronous. This is forward-compatible — when you swap to a backend, mutations become genuinely async and the calling code doesn't change.

---

## Naming Convention

Hooks follow a `use-{action}-{resource}` pattern with a singular/plural distinction:

| Hook                 | Scope      | Purpose                    |
| -------------------- | ---------- | -------------------------- |
| `use-query-chats`    | Collection | List all / filter          |
| `use-query-chat`     | Single     | Get one by ID              |
| `use-mutation-chats` | Collection | Create (returns new ID)    |
| `use-mutation-chat`  | Single     | Update / delete (takes ID) |

**Plural** = operates on the collection (list, create).
**Singular** = operates on one item (get, update, delete).

---

## Return Shape Convention

### Query hooks return:

```typescript
{
  data: T,          // The data (array for collection, object for single)
  loading: boolean, // True while fetching (always false with localStorage)
  error: boolean,   // True if fetch failed (always false with localStorage)
}
```

### Collection mutation hooks return:

```typescript
{
  add: (input: CreateType) => Promise<string | null>,  // Returns new ID or null
}
```

### Single-item mutation hooks return:

```typescript
{
  edit: (updates: UpdateType) => Promise<boolean>,  // Returns success
  delete: () => Promise<boolean>,                   // Returns success
}
```

---

## Checklist for New Hooks

- [ ] Create in `{feature}/hooks/`
- [ ] Name with `use-query-*` or `use-mutation-*` prefix
- [ ] Use plural for collection hooks, singular for single-item hooks
- [ ] Query hooks: subscribe with `useStore`, return `{ data, loading, error }`
- [ ] Mutation hooks: call store functions, wrap in try/catch, show toasts
- [ ] Mutation hooks: return `async` functions (forward-compatible with backends)
- [ ] Export named function (not default export)

---

## Detailed Documentation

- [patterns.md](patterns.md) — The four hook patterns with complete code from this codebase
