---
name: frontend-state
description: State management with nanostores. Use when creating a store, using persistentAtom or atom, implementing localStorage persistence, safe decoding, validating persisted data, adding computed values, deciding where state should live, or asking about store patterns and naming conventions.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Frontend State Management Guide

Patterns for state management using nanostores.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (stores live in `{feature}/store/`)
- **[frontend-types](../frontend-types/SKILL.md)** — Types that stores are built on
- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hooks that consume stores

---

## Quick Reference

| Topic         | File                         | Description                                          |
| ------------- | ---------------------------- | ---------------------------------------------------- |
| **Reference** | [reference.md](reference.md) | CRUD table, computed values, debug logging, template |

---

## When to Use What

| State Type                    | Solution                      | Example               |
| ----------------------------- | ----------------------------- | --------------------- |
| **Persisted entity data**     | `persistentAtom` (nanostores) | Chats, messages       |
| **Persisted user preference** | `persistentAtom` (nanostores) | Theme setting         |
| **Global UI state**           | `atom` (nanostores)           | Sidebar open/closed   |
| **Component local state**     | `useState` (React)            | Form inputs, toggles  |
| **Derived/computed state**    | `computed` (nanostores)       | Filtered list, counts |

If state needs to survive a page refresh, use `persistentAtom`. If it's global but ephemeral, use `atom`. If it's local to one component, use `useState`.

---

## State Location

Stores live in their feature's `store/` directory. One file per feature is typical:

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

Every entity store follows the same shape — a `persistentAtom` holding an array, a **safe decoder**, plus plain functions to mutate it:

```typescript
import { persistentAtom } from "@nanostores/persistent";
import { chatSchema, type ChatType } from "@/chats/types/chat";

function decodeChats(value: string): ChatType[] {
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

**Never use raw `JSON.parse` as the decode function.** localStorage is user-editable and can become malformed (schema changes, manual edits, corruption). See [Safe Decoding](#safe-decoding) below for all three patterns.

---

## The Abstraction Boundary

The store is the **only place that knows where data comes from**. Everything above — hooks, components, pages — talks to the store through its exported functions. Swap the store internals and everything above still works.

```plaintext
┌──────────────────────────────────────────────┐
│  Pages / Components / Hooks               │  ← Don't know about localStorage
├──────────────────────────────────────────────┤
│  Store ($chats, addChat, removeChat, ...) │  ← The abstraction boundary
├──────────────────────────────────────────────┤
│  persistentAtom → localStorage            │  ← Swappable
└──────────────────────────────────────────────┘
```

---

## Safe Decoding

Every `persistentAtom` needs a custom decode function that validates data with Zod and falls back to defaults on failure. Three patterns depending on the data shape:

### Array Entities

Use `reduce` + `safeParse` to keep valid items and silently drop invalid ones:

```typescript
function decodeChats(value: string): ChatType[] {
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
    return [];
  }
}
```

### Single Objects

Return the default value on validation failure:

```typescript
function decodeSettings(value: string): SettingsType {
  try {
    const parsed = JSON.parse(value);
    const result = settingsSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Fallback to defaults for malformed localStorage values.
  }

  return defaultSettings;
}
```

### Scalar Values (Enums, Primitives)

Validate manually when a Zod schema is overkill:

```typescript
function decodeTheme(value: string): Theme {
  try {
    const parsed = JSON.parse(value);
    if (parsed === "dark" || parsed === "light" || parsed === "system") {
      return parsed;
    }
  } catch {
    // Fallback to default theme for malformed localStorage values.
  }

  return "system";
}
```

---

## Checklist for New Store

- [ ] Create in `{feature}/store/{entity}.ts`
- [ ] Use `persistentAtom` for data that should survive refresh
- [ ] Use `atom` for ephemeral global state
- [ ] Prefix atom names with `$` (`$chats`, `$messages`)
- [ ] Write a safe decode function (never use raw `JSON.parse`)
- [ ] Export plain functions for mutations (`addChat`, `removeChat`)
- [ ] Components consume stores through hooks, never import stores directly

---

## Detailed Documentation

- [reference.md](reference.md) — CRUD function table, plain atom, computed values, debug logging, store file template
