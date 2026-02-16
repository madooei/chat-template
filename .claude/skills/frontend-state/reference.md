# State Reference

## Plain Atom

For global state that doesn't need to survive a page refresh:

```typescript
import { atom } from "nanostores";

export const $sidebarOpen = atom(false);
```

---

## Standard CRUD Functions

Every entity store exports these:

| Function                 | Purpose                          |
| ------------------------ | -------------------------------- |
| `add{Entity}(entity)`    | Append a new entity to the array |
| `update{Entity}(entity)` | Replace an entity by `_id`       |
| `remove{Entity}(id)`     | Filter out an entity by `_id`    |
| `clear{Entities}()`      | Reset to empty array             |

Some stores add feature-specific functions like `removeMessagesByChatId` for cascade deletes.

---

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

Computed atoms update automatically when their source atoms change.

---

## Debug Logging

Use `@nanostores/logger` behind a `DEBUG` flag:

```typescript
import { logger } from "@nanostores/logger";

const DEBUG = false;

// ... atom and functions ...

if (DEBUG) {
  logger({ $chats });
}
```

Set `DEBUG = true` during development. Set back to `false` before committing.

---

## Store File Template

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
