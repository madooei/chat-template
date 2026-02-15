# Type Naming and Organization

## File Organization

Types live in their feature's `types/` directory. One file per entity:

```plaintext
chats/types/
└── chat.ts        # All chat-related schemas and types

messages/types/
└── message.ts     # All message-related schemas and types
```

Keep it simple. You rarely need more than one type file per feature. If a feature grows complex enough to need multiple type files, split by entity, not by purpose.

## Naming Conventions

### Schemas (camelCase)

```typescript
export const createChatSchema = ...   // create{Entity}Schema
export const updateChatSchema = ...   // update{Entity}Schema
export const chatSchema = ...         // {entity}Schema
```

### Types (PascalCase with Type suffix)

```typescript
export type CreateChatType = ...      // Create{Entity}Type
export type UpdateChatType = ...      // Update{Entity}Type
export type ChatType = ...            // {Entity}Type
```

The `Type` suffix prevents ambiguity. Without it, `Chat` could be a component, a class, or a variable. `ChatType` is unambiguously a type.

## Import Patterns

Use `import type` for type-only imports. This makes it clear the import is erased at runtime and helps with tree-shaking:

```typescript
// ✅ Type-only import
import type { ChatType } from "@/chats/types/chat";
import type { CreateMessageType } from "@/messages/types/message";

// ✅ Mixed — when you need both the schema and the type
import { createChatSchema } from "@/chats/types/chat";
import type { CreateChatType } from "@/chats/types/chat";
```

## Interface vs Type

Both work for object shapes. Here's when to use which:

**Use `type` for:**

- Zod-inferred types (always — this is how `z.infer` works)
- Union types
- Mapped or utility types

```typescript
// Zod-inferred (always a type)
export type ChatType = z.infer<typeof chatSchema>;

// Union
type Role = "user" | "assistant";

// Utility
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

**Use `interface` for:**

- Component props
- Function parameter objects
- Shapes you might extend later

```typescript
// Component props
interface MessageProps {
  message: MessageType;
  onDelete?: (messageId: string) => void;
}

// Extendable shape
interface PageProps {
  chatId: string;
}
```

In practice, most types in this codebase are Zod-inferred (`type`), and most component props are interfaces. Don't overthink it — consistency within a file matters more than the choice itself.

## Type Guards

When you have a union type and need to narrow it at runtime, write a type guard:

```typescript
// A union type
type Role = "user" | "assistant";

// A type guard
function isUserMessage(message: MessageType): boolean {
  return message.role === "user";
}
```

For more complex discriminated unions (e.g., different content types with different shapes), use the `content is X` pattern:

```typescript
interface TextContent {
  kind: "text";
  body: string;
}

interface ImageContent {
  kind: "image";
  url: string;
}

type Content = TextContent | ImageContent;

function isTextContent(content: Content): content is TextContent {
  return content.kind === "text";
}
```

You probably won't need this in a simple CRUD app, but it becomes important when your entities have variant shapes.

## Exhaustive Checks

When switching over a union, use `assertNever` to catch unhandled cases at compile time:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function getRoleLabel(role: "user" | "assistant"): string {
  switch (role) {
    case "user":
      return "You";
    case "assistant":
      return "AI";
    default:
      return assertNever(role); // Compile error if a case is missing
  }
}
```

This is a safety net. If you add a new variant to the union later, TypeScript will flag every switch statement that doesn't handle it.
