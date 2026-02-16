---
name: frontend-routing
description: Routing patterns with @nanostores/router. Use when adding routes, adding a new page, implementing navigation, using createRouter or $router, working with route parameters, or asking about how pages are resolved and rendered.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Frontend Routing Guide

Patterns for routing with `@nanostores/router`.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (pages live in `{feature}/pages/`)
- **[frontend-components](../frontend-components/SKILL.md)** — Page component patterns

---

## Architecture

Routing is centralized in one file:

```plaintext
src/app/
└── router.ts       # Route definitions + route-to-page resolution
```

`App.tsx` imports `$router` and renders whatever page the router resolves. Every feature can import it via `import { $router } from "@/app/router"`.

---

## Route Definition

Routes are a flat map of route names to URL patterns:

```typescript
// src/app/router.ts
import { createRouter } from "@nanostores/router";

export const $router = createRouter({
  home: "/",
  addChat: "/chats/new",
  messages: "/chats/:id/messages",
  editChat: "/chats/:id",
});
```

Order matters — more specific routes before less specific ones (e.g., `messages` before `editChat`, since both match `/chats/:id/*`).

---

## Route Resolution

`App.tsx` subscribes to `$router` and renders the appropriate page. Parameters are accessed via `page.params` (always strings):

```typescript
// src/App.tsx
import { useStore } from "@nanostores/react";
import { $router } from "@/app/router";

function App() {
  const page = useStore($router);

  let content: React.ReactNode;
  if (page?.route === "addChat") {
    content = <AddChatPage />;
  } else if (page?.route === "messages") {
    content = <MessagesPage chatId={page.params.id} />;
  } else if (page?.route === "editChat") {
    content = <EditChatPage chatId={page.params.id} />;
  } else {
    content = <EmptyState />;
  }

  return <Layout>{content}</Layout>;
}
```

`page` is `null` when no route matches (404 state).

---

## Navigation

Navigate with `$router.open()` using URL strings (not route names):

```typescript
import { $router } from "@/app/router";

$router.open("/");
$router.open("/chats/new");
$router.open(`/chats/${chatId}/messages`);
```

---

## Deriving State from Routes

Use the current route to derive UI state like active items in a sidebar:

```typescript
const page = useStore($router);

const activeChatId =
  page?.route === "editChat" || page?.route === "messages"
    ? page.params.id
    : undefined;

return <ChatList activeChatId={activeChatId} />;
```

---

## Adding a New Route

1. Add the route to `createRouter` in `src/app/router.ts`:

   ```typescript
   export const $router = createRouter({
     // ... existing routes
     newRoute: "/some/path/:param",
   });
   ```

2. Create the page component in the appropriate feature's `pages/` directory

3. Add the route resolution in `App.tsx`:

   ```typescript
   } else if (page?.route === "newRoute") {
     content = <NewPage param={page.params.param} />;
   }
   ```

4. Update derived state (e.g., `activeChatId`) if the new route should highlight a sidebar item

---

## Checklist for New Routes

- [ ] Add route to `createRouter` map in `src/app/router.ts`
- [ ] Place more specific patterns before less specific ones
- [ ] Create page component in `{feature}/pages/`
- [ ] Add `else if` branch in `App.tsx` route resolution
- [ ] Update derived state (e.g., `activeChatId`) if needed
- [ ] Update navigation calls in related pages
