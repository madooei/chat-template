---
name: frontend-routing
description: Routing patterns with @nanostores/router. Use when adding routes, implementing navigation, working with route parameters, or asking about how pages are resolved and rendered.
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

# Frontend Routing Guide

Patterns for routing with `@nanostores/router`.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (pages live in `{feature}/pages/`)
- **[frontend-components](../frontend-components/SKILL.md)** — Page component patterns

---

## Why Nanostores Router

We use `@nanostores/router` instead of React Router because:

- **Tiny** — ~1KB, no framework overhead
- **Flat** — no nested routes, no loaders, no error elements. Just a route map and a store.
- **Consistent** — same nanostores pattern as our state management (`useStore`, `$atom`)
- **Swappable** — if you later need React Router or TanStack Router, you replace one file

The trade-off: no built-in code splitting, no nested layouts, no route-level data loading. For a frontend-only template with a handful of routes, this is the right trade-off.

---

## Architecture

Routing is centralized in `src/app/`:

```plaintext
src/app/
└── router.ts       # Route definitions + route-to-page resolution
```

`App.tsx` imports from `src/app/router.ts` and renders whatever page the router resolves. All route definitions live in one place.

---

## Route Definition

Routes are defined with `createRouter` — a flat map of route names to URL patterns:

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

**Key points:**

- Route names (`home`, `addChat`, `messages`) are used in code to reference routes
- URL patterns support `:param` syntax for dynamic segments
- **Order matters** — more specific routes must come before less specific ones (e.g., `messages` before `editChat`, since both match `/chats/:id/*`)
- The router is a nanostores atom (`$router`) — subscribe with `useStore` like any other atom

---

## Route Resolution

`App.tsx` subscribes to `$router` and renders the appropriate page:

```typescript
// src/App.tsx
import { useStore } from "@nanostores/react";
import { $router } from "@/app/router";

function App() {
  const page = useStore($router);

  // Resolve route to page component
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

**Key points:**

- `page` is `null` if no route matches (404 state)
- `page.route` is the route name from `createRouter`
- `page.params` contains the URL parameters (e.g., `page.params.id` for `:id`)
- Route resolution is a simple `if/else` chain — no magic, easy to read

---

## Navigation

Navigate programmatically with `$router.open()`:

```typescript
import { $router } from "@/app/router";

// Navigate to a URL
$router.open("/");
$router.open("/chats/new");
$router.open(`/chats/${chatId}/messages`);

// In an event handler
const handleCancel = () => {
  $router.open("/");
};

// After an async operation
const handleSubmit = async (values: CreateChatType) => {
  const chatId = await createChat(values);
  if (chatId) {
    $router.open(`/chats/${chatId}/messages`);
  }
};
```

Navigation is always done with URL strings, not route names. This keeps it simple and explicit.

---

## Route Parameters

Dynamic segments in the URL are accessed via `page.params`:

```typescript
const page = useStore($router);

// Route: messages: "/chats/:id/messages"
// URL:   /chats/abc-123/messages
// page.params.id === "abc-123"

if (page?.route === "messages") {
  return <MessagesPage chatId={page.params.id} />;
}
```

Parameters are always strings. If you need a different type, parse it in the page component.

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

1. **Add the route** to the route map in `src/app/router.ts`:

   ```typescript
   export const $router = createRouter({
     // ... existing routes
     newRoute: "/some/path/:param",
   });
   ```

2. **Create the page component** in the appropriate feature's `pages/` directory

3. **Add the route resolution** in `App.tsx`:

   ```typescript
   } else if (page?.route === "newRoute") {
     content = <NewPage param={page.params.param} />;
   }
   ```

4. **Update `activeChatId`** or similar derived state if the new route should highlight a sidebar item

---

## Router Location

The router is app-wide infrastructure. It lives in `src/app/router.ts`, not inside any feature directory. Every feature can import it:

```typescript
import { $router } from "@/app/router";
```

This keeps routing centralized. When you need to understand all the routes in the app, there's one file to read.

---

## Checklist for New Routes

- [ ] Add route to `createRouter` map in `src/app/router.ts`
- [ ] Place more specific patterns before less specific ones
- [ ] Create page component in `{feature}/pages/`
- [ ] Add `else if` branch in `App.tsx` route resolution
- [ ] Update derived state (e.g., `activeChatId`) if needed
- [ ] Update navigation calls in related pages (e.g., after create → navigate to new route)
