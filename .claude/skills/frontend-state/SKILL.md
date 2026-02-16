---
name: frontend-state
description: State management patterns with nanostores. Use when managing global state, implementing localStorage persistence, creating stores for features, or deciding where state should live.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

# Frontend State Management Guide

Patterns for state management in the frontend codebase using nanostores.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (stores live in `{feature}/store/`)
- **[frontend-types](../frontend-types/SKILL.md)** — Types that stores are built on
- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hooks that consume stores

---

## Quick Reference

| Topic          | File                           | Description                                |
| -------------- | ------------------------------ | ------------------------------------------ |
| **Nanostores** | [nanostores.md](nanostores.md) | Atoms, persistent atoms, actions, useStore |

---

## When to Use What

| State Type                    | Solution                      | Example               |
| ----------------------------- | ----------------------------- | --------------------- |
| **Persisted entity data**     | `persistentAtom` (nanostores) | Chats, messages       |
| **Persisted user preference** | `persistentAtom` (nanostores) | Theme setting         |
| **Global UI state**           | `atom` (nanostores)           | Sidebar open/closed   |
| **Component local state**     | `useState` (React)            | Form inputs, toggles  |
| **Derived/computed state**    | `computed` (nanostores)       | Filtered list, counts |

**The rule of thumb:** If state needs to survive a page refresh, use `persistentAtom`. If it's global but ephemeral, use `atom`. If it's local to one component, use `useState`.

---

## State Location

Stores live in their feature's `store/` directory (singular). One file per feature is typical:

```plaintext
src/
├── chats/store/
│   ├── chat.ts           # $chats atom + CRUD functions
│   └── router.ts         # App-wide route definitions
├── messages/store/
│   └── message.ts        # $messages atom + CRUD functions
└── store/
    └── theme.ts          # Shared theme store
```

---

## The Store Pattern

Every entity store follows the same shape — a `persistentAtom` holding an array, plus plain functions to mutate it:

```typescript
import { persistentAtom } from "@nanostores/persistent";
import type { ChatType } from "@/chats/types/chat";

export const $chats = persistentAtom<ChatType[]>("chats", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function addChat(newChat: ChatType) {
  $chats.set([...$chats.get(), newChat]);
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
```

**Why this works:**

- `persistentAtom` automatically syncs to localStorage — no manual load/save
- Actions are plain functions, not methods on a class — easy to import and test
- The store key (`"chats"`) is the localStorage key — simple and transparent
- Hooks wrap these functions to provide React integration (see frontend-hooks skill)

---

## The Abstraction Boundary

This is the most important concept in the state layer. The store is the **only place that knows where data comes from**. Right now it's localStorage via `persistentAtom`. In the future, it could be a backend API, a database, or anything else.

Everything above the store — hooks, components, pages — only talks to the store through its exported functions. Swap the store internals, and everything above still works.

```plaintext
┌──────────────────────────────────────────────┐
│  Pages / Components / Hooks               │  ← Don't know about localStorage
├──────────────────────────────────────────────┤
│  Store ($chats, addChat, removeChat, ...) │  ← The abstraction boundary
├──────────────────────────────────────────────┤
│  persistentAtom → localStorage            │  ← Swappable (Act 2: Convex, etc.)
└──────────────────────────────────────────────┘
```

---

## React Context

We don't currently use React Context in this template. Nanostores + `useStore` covers our needs.

Context becomes useful when:

- You need to pass server-fetched data down a component tree without prop drilling
- You have session-scoped state that should be isolated per subtree
- You're batching related queries to avoid N+1 problems

If you need Context later, the pattern is: create a context + provider in `lib/`, consume via a custom hook, and compose providers in your page component.

---

## Checklist for New Store

- [ ] Create in `{feature}/store/{entity}.ts`
- [ ] Use `persistentAtom` for data that should survive refresh
- [ ] Use `atom` for ephemeral global state
- [ ] Export the atom with `$` prefix (`$chats`, `$messages`)
- [ ] Export plain functions for mutations (`addChat`, `removeChat`)
- [ ] Add debug logging behind a `DEBUG` flag using `@nanostores/logger`

---

## Detailed Documentation

- [nanostores.md](nanostores.md) — Atoms, persistent atoms, actions, computed values, debug logging
