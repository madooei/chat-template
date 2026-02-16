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
  messages: "/chats/:id/messages",
});
```

Order matters — more specific routes before less specific ones.

---

## Route Resolution

`App.tsx` subscribes to `$router` and renders the appropriate page. Parameters are accessed via `page.params` (always strings). The layout uses a `sidebar` + `content` pattern:

```typescript
// src/App.tsx
import { useStore } from "@nanostores/react";
import { $router } from "@/app/router";

function App() {
  const page = useStore($router);
  const activeChatId = page?.route === "messages" ? page.params.id : undefined;

  const renderContent = () => {
    switch (page?.route) {
      case "messages":
        return <MessagesPage chatId={page.params.id} />;
      default:
        return <HomeEmptyState />;
    }
  };

  return (
    <Layout
      sidebar={<ListChatsPage activeChatId={activeChatId} />}
      content={renderContent()}
    />
  );
}
```

`page` is `null` when no route matches (404 state).

---

## Navigation

Navigate with `$router.open()` using URL strings (not route names):

```typescript
import { $router } from "@/app/router";

$router.open("/");
$router.open(`/chats/${chatId}/messages`);
```

---

## Deriving State from Routes

Use the current route to derive UI state like active items in a sidebar:

```typescript
const page = useStore($router);

const activeChatId =
  page?.route === "messages" ? page.params.id : undefined;

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

3. Add a `case` branch in the `renderContent` switch in `App.tsx`:

   ```typescript
   case "newRoute":
     return <NewPage param={page.params.param} />;
   ```

4. Update derived state (e.g., `activeChatId`) if the new route should highlight a sidebar item

---

## Checklist for New Routes

- [ ] Add route to `createRouter` map in `src/app/router.ts`
- [ ] Place more specific patterns before less specific ones
- [ ] Create page component in `{feature}/pages/`
- [ ] Add `case` branch in `App.tsx` `renderContent` switch
- [ ] Update derived state (e.g., `activeChatId`) if needed
- [ ] Update navigation calls in related pages
