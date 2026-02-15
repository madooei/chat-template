# Zod Schema Patterns

Zod gives us runtime validation and TypeScript types from a single source of truth. We use it for all entity definitions in this project.

## The 3-Schema Pattern

Every entity follows the same layered approach. Here's the real example from `src/messages/types/message.ts`:

```typescript
import { z } from "zod";

// 1. Create schema — fields the user provides
export const createMessageSchema = z.object({
  chatId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

// 2. Update schema — all fields become optional
export const updateMessageSchema = createMessageSchema.partial();

// 3. Full entity schema — adds system fields
export const messageSchema = createMessageSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
});

// Inferred types
export type CreateMessageType = z.infer<typeof createMessageSchema>;
export type UpdateMessageType = z.infer<typeof updateMessageSchema>;
export type MessageType = z.infer<typeof messageSchema>;
```

## Schema Extension

Use `.extend()` to add fields and `.partial()` to make fields optional. These derive from the base schema so you define each field once:

```typescript
// Base — what the user provides
export const createChatSchema = z.object({
  title: z.string().min(1),
});

// Partial — for updates (title becomes optional)
export const updateChatSchema = createChatSchema.partial();

// Extended — full entity with system fields
export const chatSchema = createChatSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
});
```

## When to Use Zod vs Interfaces

**Use Zod schemas for:**

- Entity definitions (the 3-schema pattern)
- User input that needs validation
- Data coming from external sources (APIs, localStorage)

**Use interfaces for:**

- Component props
- Internal function signatures
- Shapes that don't need runtime validation

```typescript
// Zod — validated entity
export const chatSchema = z.object({
  _id: z.string(),
  title: z.string().min(1),
});
export type ChatType = z.infer<typeof chatSchema>;

// Interface — component props (no validation needed)
interface ChatListProps {
  activeChatId?: string;
}
```

## Common Zod Methods

### String Validation

```typescript
z.string(); // any string
z.string().min(1); // non-empty (use for required fields)
z.string().email(); // must be valid email
z.string().url(); // must be valid URL
z.string().max(500); // max length
```

### Optional and Nullable

```typescript
z.string().optional(); // string | undefined — field may be absent
z.string().nullable(); // string | null — field present but can be null
z.string().nullish(); // string | null | undefined — either
```

### Enums

```typescript
// String enum
export const roleEnum = z.enum(["user", "assistant"]);
export type RoleType = z.infer<typeof roleEnum>;
// Result: "user" | "assistant"
```

### Arrays and Nested Objects

```typescript
export const entitySchema = z.object({
  tags: z.array(z.string()),
  metadata: z
    .object({
      createdBy: z.string(),
      version: z.number(),
    })
    .optional(),
});
```

## System Fields Convention

All persisted entities include these system fields, added in the full entity schema:

```typescript
.extend({
  _id: z.string(),           // Unique identifier (UUID)
  _creationTime: z.number(), // Timestamp (Date.now())
})
```

The `_` prefix signals these are system-managed, not user-provided. The store layer assigns them when creating entities — they never appear in create/update schemas.
