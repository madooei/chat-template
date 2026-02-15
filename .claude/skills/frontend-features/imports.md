# Import Conventions

## Path Alias

The `@/` alias maps to `src/`. Use it for all imports outside the current feature:

```typescript
// @/ maps to src/
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { $router } from "@/chats/store/router";
```

Use relative imports only within the same feature:

```typescript
// Within chats/hooks/
import { useQueryChat } from "./use-query-chat";

// From a sibling directory within the same feature
import type { ChatType } from "../types/chat";
import { addChat } from "../store/chat";
```

## Import Order

Organize imports in four groups, separated by blank lines:

```typescript
// 1. React and built-in modules
import { useState, useEffect, useCallback } from "react";

// 2. Third-party libraries
import { useStore } from "@nanostores/react";
import { toast } from "sonner";
import { z } from "zod";

// 3. Absolute path imports (@/) — shared code and other features
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { $router } from "@/chats/store/router";
import type { ChatType } from "@/chats/types/chat";

// 4. Relative imports — within the same feature
import { useQueryChat } from "./use-query-chat";
import { updateChat, removeChat } from "../store/chat";
```

**Notes:**

- `import type` can appear in any group — place it with its source group
- Within each group, there's no strict ordering, but keep related imports together

## Feature-to-Feature Imports

Import directly from specific files, never from a feature root:

```typescript
// ✅ Good — direct import from a specific file
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { removeMessage } from "@/messages/store/message";

// ❌ Bad — barrel import from feature root
import { useQueryChat, removeMessage } from "@/chats";
```

## Type Imports

Use `import type` for imports that are only used as TypeScript types. This makes it clear the import is erased at runtime:

```typescript
// ✅ Type-only import
import type { ChatType } from "@/chats/types/chat";
import type { MessageType } from "@/messages/types/message";

// ✅ Mixed — value and type from same module
import { chatSchema } from "@/chats/types/chat";
import type { ChatType } from "@/chats/types/chat";
```

## Shared Code Imports

Shared code lives in top-level directories under `src/`:

```typescript
// UI primitives (shadcn/ui components)
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

// Shared components
import { ThemeToggle } from "@/components/theme-toggle";

// Utilities
import { cn } from "@/lib/utils";

// Shared hooks
import { useTheme } from "@/hooks/use-theme";

// Layout
import Layout from "@/layout";
```

## Common Patterns

### Store imports in hooks

Hooks import from their feature's store:

```typescript
// chats/hooks/use-query-chats.ts
import { useStore } from "@nanostores/react";
import { $chats } from "@/chats/store/chat";
```

### Cross-feature store imports

When one feature needs another feature's store (e.g., cascade delete):

```typescript
// chats/hooks/use-mutation-chat.ts
import { updateChat, removeChat } from "@/chats/store/chat";
import { removeMessagesByChatId } from "@/messages/store/message";
```

### Router imports

The router is defined in the chats feature but used everywhere:

```typescript
import { $router } from "@/chats/store/router";
```

If the router grows beyond chat-related routes, consider moving it to `src/store/router.ts`.
