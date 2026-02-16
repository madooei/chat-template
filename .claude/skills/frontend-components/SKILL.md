---
name: frontend-components
description: Component patterns and UI library usage. Use when creating components, using shadcn/ui, implementing theming, working with forms, using icons, showing toasts, or asking about component organization and patterns.
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

# Frontend Components Guide

Patterns for creating components and using the UI library.

## Related Skills

- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization (components live in `{feature}/components/`)
- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hooks that components consume
- **[frontend-design](../frontend-design/SKILL.md)** — Visual design and layout patterns
- **[frontend-prompt-kit](../frontend-prompt-kit/SKILL.md)** — AI chat UI primitives (message, chat container, markdown, etc.)

---

## Quick Reference

| Topic        | File                       | Description                        |
| ------------ | -------------------------- | ---------------------------------- |
| **Patterns** | [patterns.md](patterns.md) | Common patterns from this codebase |

---

## Component Location

| Type        | Location                     | Purpose                                |
| ----------- | ---------------------------- | -------------------------------------- |
| **Feature** | `src/{feature}/components/`  | Feature-specific UI                    |
| **Page**    | `src/{feature}/pages/`       | Route entry points (thin wrappers)     |
| **Shared**  | `src/components/`            | Reusable across features               |
| **UI**      | `src/components/ui/`         | shadcn/ui primitives                   |
| **AI UI**   | `src/components/prompt-kit/` | prompt-kit AI chat primitives          |
| **Layout**  | `src/layout/`                | Page structure (header, footer, shell) |

---

## shadcn/ui Components

shadcn/ui components are copy-pasted into `src/components/ui/`. They're your code — you own them and can modify them. Import from `@/components/ui/*`:

```typescript
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

### Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

To add new shadcn/ui components, use `npx shadcn@latest add <component>`. This downloads the component source into `src/components/ui/`.

---

## Class Merging with `cn()`

Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally:

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes px-4 py-2",
  isActive && "bg-secondary font-medium",
  className,  // allow override from props
)}>
```

`cn()` uses `clsx` + `tailwind-merge` under the hood. It handles conditional classes and resolves Tailwind conflicts (e.g., `p-4` + `px-2` correctly yields `py-4 px-2`).

---

## Icons

Use `lucide-react` for icons. Standard size is `h-4 w-4`:

```typescript
import { Settings, Send, Plus, Trash2, Sun, Moon } from "lucide-react";

<Settings className="h-4 w-4" />

// In a button
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

---

## Toasts

Use `sonner` for toast notifications. Toasts are typically called from mutation hooks, not directly from components:

```typescript
import { toast } from "sonner";

toast.success("Chat created successfully");

toast.error("Error creating chat", {
  description: "Please try again later",
});
```

The `<Toaster>` component is mounted once in `main.tsx` with `richColors` and `position="top-center"`.

---

## Theming

The theme system uses CSS variables + a `dark` class on `<html>`. Three modes: `light`, `dark`, `system`.

### How It Works

1. **`src/store/theme.ts`** — `persistentAtom` stores the user's choice (`"light"`, `"dark"`, or `"system"`)
2. **`src/hooks/use-theme.tsx`** — `useTheme()` hook exposes `{ theme, setTheme }`
3. **`src/App.tsx`** — `useEffect` applies the correct class to `<html>` on theme change
4. **`src/styles/index.css`** — CSS variables for `:root` (light) and `.dark` (dark)

### Theme-Aware Styling

Prefer CSS variables over hardcoded colors. They automatically adapt to light/dark mode:

```tsx
// ✅ Uses CSS variables — adapts to theme
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="text-muted-foreground">

// ✅ dark: prefix for explicit overrides
<div className="bg-white dark:bg-gray-900">

// ❌ Hardcoded colors — breaks in dark mode
<div className="bg-white text-black">
```

### Key CSS Variables

| Variable                         | Usage                           |
| -------------------------------- | ------------------------------- |
| `background/foreground`          | Page background and text        |
| `primary/primary-foreground`     | Buttons, user message bubbles   |
| `secondary/secondary-foreground` | Secondary UI, assistant bubbles |
| `muted/muted-foreground`         | Disabled text, placeholders     |
| `destructive`                    | Delete buttons, error states    |
| `border`                         | Borders, dividers               |
| `input`                          | Input field borders             |
| `ring`                           | Focus rings                     |

---

## Basic Component Pattern

```typescript
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  className?: string;
  onAction?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, className, onAction }) => {
  return (
    <div className={cn("p-4", className)}>
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
};

export default MyComponent;
```

**Conventions:**

- Props defined as an `interface` above the component
- `className` prop when the component's root element can be styled by parents
- `cn()` to merge base classes with `className` prop
- `React.FC<Props>` for typing, `const` declaration with default export for feature components

---

## Checklist for New Components

- [ ] Create in appropriate directory (feature, shared, or layout)
- [ ] Define typed props interface
- [ ] Use `cn()` for class merging when accepting `className` prop
- [ ] Use CSS variables (`bg-primary`, `text-muted-foreground`) not hardcoded colors
- [ ] Use `lucide-react` for icons at `h-4 w-4` standard size
- [ ] Consume data through hooks, not by importing stores directly

---

## Detailed Documentation

- [patterns.md](patterns.md) — Common component patterns from this codebase
