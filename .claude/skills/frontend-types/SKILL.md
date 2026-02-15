---
name: frontend-types
description: TypeScript type definition patterns for the frontend. Use when defining new types, creating Zod schemas for validation, writing type guards, or asking about type organization and naming conventions.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Frontend Types Guide

Patterns for TypeScript type definitions in the frontend codebase.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (types live in `{feature}/types/`)
- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hooks consume these types
- **[frontend-state](../frontend-state/SKILL.md)** — Stores are typed with these schemas

---

## Quick Reference

| Topic           | File                             | Description                            |
| --------------- | -------------------------------- | -------------------------------------- |
| **Zod Schemas** | [zod-schemas.md](zod-schemas.md) | Runtime validation and schema layering |
| **Conventions** | [conventions.md](conventions.md) | Naming, organization, and patterns     |

---

## Type Location

Types live in their feature's `types/` directory. One file per entity:

```plaintext
src/
├── chats/types/
│   └── chat.ts          # Chat schemas + types
├── messages/types/
│   └── message.ts       # Message schemas + types
└── types/
    └── theme.ts         # Shared types (used across features)
```

---

## The 3-Schema Pattern

Every entity follows the same layered schema pattern:

```typescript
import { z } from "zod";

// 1. Create schema — what the user provides
export const createChatSchema = z.object({
  title: z.string().min(1),
});

// 2. Update schema — partial of create (all fields optional)
export const updateChatSchema = createChatSchema.partial();

// 3. Full entity schema — extends create with system fields
export const chatSchema = createChatSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
});

// Inferred types
export type CreateChatType = z.infer<typeof createChatSchema>;
export type UpdateChatType = z.infer<typeof updateChatSchema>;
export type ChatType = z.infer<typeof chatSchema>;
```

**Why three schemas?**

- `createSchema` defines what the user controls — used in forms and mutation hooks
- `updateSchema` makes everything optional — used for partial edits
- `entitySchema` adds system fields (`_id`, `_creationTime`) — represents the full stored object

This layering means you define each field exactly once. The update and entity schemas derive from create.

---

## Naming Conventions

| Pattern                | Usage            | Example                                   |
| ---------------------- | ---------------- | ----------------------------------------- |
| `create{Entity}Schema` | Create input     | `createChatSchema`, `createMessageSchema` |
| `update{Entity}Schema` | Update input     | `updateChatSchema`, `updateMessageSchema` |
| `{entity}Schema`       | Full entity      | `chatSchema`, `messageSchema`             |
| `Create{Entity}Type`   | Create type      | `CreateChatType`, `CreateMessageType`     |
| `Update{Entity}Type`   | Update type      | `UpdateChatType`, `UpdateMessageType`     |
| `{Entity}Type`         | Full entity type | `ChatType`, `MessageType`                 |

Always use the `Type` suffix to distinguish types from components or variables:

```typescript
// ✅ Clear — this is a type
export type ChatType = z.infer<typeof chatSchema>;

// ❌ Ambiguous — could be a component, a class, a variable
export type Chat = z.infer<typeof chatSchema>;
```

---

## Checklist for New Types

- [ ] Create file in `{feature}/types/{entity}.ts`
- [ ] Define `create{Entity}Schema` with user-provided fields
- [ ] Derive `update{Entity}Schema` via `.partial()`
- [ ] Extend to `{entity}Schema` with `_id` and `_creationTime`
- [ ] Export all three schemas and their inferred types
- [ ] Use `Type` suffix on all type names

---

## Detailed Documentation

- [zod-schemas.md](zod-schemas.md) — Zod patterns, schema extension, validation, optional vs nullable
- [conventions.md](conventions.md) — Naming rules, interface vs type, import patterns, type guards
