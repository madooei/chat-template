---
name: frontend-design
description: UI/UX design guidance for clean, minimal interfaces. Use when designing new UI, reviewing design decisions, implementing layouts, choosing colors or spacing, adding animations, or asking about usability, visual hierarchy, and accessibility.
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

# Frontend Design Guide

Design philosophy and visual guidelines for this project.

## Related Docs

- **[AI-CHAT-PATTERNS.md](./AI-CHAT-PATTERNS.md)** — AI chat-specific UI patterns (layout, messages, input, scrolling, accessibility)

## Related Skills

- **[frontend-components](../frontend-components/SKILL.md)** — Component patterns and shadcn/ui usage
- **[frontend-features](../frontend-features/SKILL.md)** — Feature organization

---

## Design Philosophy

**Core beliefs:**

- **Clarity over cleverness** — Users should understand the interface instantly
- **Quiet confidence** — Design that doesn't need to shout
- **Strategic delight** — Wow moments at key interactions, restraint elsewhere
- **User-first decisions** — Usability drives aesthetics, never the reverse

**This is NOT about:**

- Being boring or plain
- Avoiding all visual interest
- Following trends blindly
- Maximizing information density

---

## Semantic Tokens

Always use CSS variable-based tokens instead of hardcoded colors. They automatically adapt to light and dark mode.

### Backgrounds

| Token            | Usage              | Example                   |
| ---------------- | ------------------ | ------------------------- |
| `bg-background`  | Page background    | Main content area         |
| `bg-card`        | Elevated surfaces  | Cards, dialogs            |
| `bg-muted`       | Subtle backgrounds | Sidebar, tags             |
| `bg-accent`      | Hover/focus states | List item hover           |
| `bg-primary`     | Primary actions    | Buttons, user bubbles     |
| `bg-secondary`   | Secondary UI       | Assistant bubbles, badges |
| `bg-destructive` | Dangerous actions  | Delete buttons            |

### Text

| Token                   | Usage           | Example                |
| ----------------------- | --------------- | ---------------------- |
| `text-foreground`       | Primary text    | Headings, body text    |
| `text-muted-foreground` | Secondary text  | Descriptions, metadata |
| `text-primary`          | Emphasis, links | CTAs, active states    |

### Borders

| Token           | Usage              |
| --------------- | ------------------ |
| `border-border` | Default borders    |
| `border-input`  | Form input borders |
| `ring-ring`     | Focus indicators   |

```tsx
// ✅ Semantic tokens — adapts to theme
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">

// ✅ dark: prefix for explicit overrides when needed
<div className="bg-white dark:bg-gray-900">

// ❌ Hardcoded colors — breaks in dark mode
<div className="bg-white text-black">
<div className="bg-[#f5f5f5]">  // Use bg-muted instead
```

---

## Spacing

Use Tailwind's standard spacing scale consistently. Avoid arbitrary values.

| Scale | Value | Common Use                         |
| ----- | ----- | ---------------------------------- |
| `1`   | 4px   | Icon margins, tight inline spacing |
| `2`   | 8px   | Icon gaps, compact lists           |
| `3`   | 12px  | Small element padding              |
| `4`   | 16px  | Default padding, standard gaps     |
| `6`   | 24px  | Card padding, section gaps         |
| `8`   | 32px  | Large section spacing              |

```tsx
// Related items — tight
<div className="space-y-2">
  <Label>Email</Label>
  <Input />
</div>

// Between form fields — standard
<div className="space-y-4">
  <FormField />
  <FormField />
</div>

// Between sections — generous
<div className="space-y-8">
  <Section />
  <Section />
</div>
```

---

## Typography

| Class       | Size | Use Case               |
| ----------- | ---- | ---------------------- |
| `text-xs`   | 12px | Fine print, timestamps |
| `text-sm`   | 14px | Helper text, labels    |
| `text-base` | 16px | Body text (default)    |
| `text-lg`   | 18px | Subheadings            |
| `text-2xl`  | 24px | Page titles            |

### Recommended Combinations

```tsx
// Page title
<h2 className="text-2xl font-bold">

// Section heading
<h2 className="text-lg font-semibold">

// Body text
<p className="text-sm">

// Helper / secondary text
<p className="text-sm text-muted-foreground">

// Label
<label className="text-sm font-medium">
```

---

## Visual Hierarchy

### Spacing Creates Hierarchy

Group related items tightly (`space-y-2`), separate unrelated sections generously (`space-y-8`). The eye reads proximity as relationship.

### Button Hierarchy

One primary action per view. Everything else is secondary or ghost:

```tsx
// Primary action (one per view)
<Button>Save Changes</Button>

// Secondary actions
<Button variant="outline">Cancel</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Toolbar / navigation
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### Borders and Shadows

```tsx
// Flat surfaces — border only
<div className="border-b">

// Cards — subtle border, minimal shadow
<Card className="border shadow-sm">

// Dropdowns, modals — more lift
<div className="border shadow-md">

// Avoid heavy shadows
shadow-lg shadow-xl    // Rarely needed
```

### Border Radius

Pick one system and be consistent:

```tsx
rounded - md; // Buttons, inputs, small elements
rounded - lg; // Cards, dialogs
rounded - full; // Avatars, icon buttons only
```

---

## Motion

Motion should be purposeful, fast, and rare.

### Transitions

```tsx
// Quick interactions (hover, focus) — 150ms
<div className="transition-colors duration-150 hover:bg-accent">

// Standard state changes — 200ms
<div className="transition-all duration-200">

// Avoid slow animations
duration-500 duration-700    // Too sluggish for UI
```

### Where to Use Motion

| Context             | Approach                                 |
| ------------------- | ---------------------------------------- |
| Hover states        | `transition-colors hover:bg-*`           |
| Focus states        | Built-in `focus-visible:ring-*`          |
| Button press        | `active:scale-[0.98]`                    |
| Theme icon rotation | `transition-all duration-150`            |
| Scroll to bottom    | `scrollIntoView({ behavior: "smooth" })` |

### Where to Avoid Motion

- Forms and data entry
- Navigation and menus
- Lists and tables
- Error messages (clarity over cleverness)

---

## Accessibility Essentials

### Keyboard Navigation

All interactive elements must be keyboard-accessible:

```tsx
// Buttons are focusable by default — use <button>, not <div onClick>
<button onClick={handleClick}>Click me</button>

// Visible focus rings (shadcn handles this)
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring

// Icon buttons need labels
<Button size="icon" aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>
```

### Semantic HTML

Use the right element for the job:

```tsx
<nav>       // Navigation
<main>      // Main content
<header>    // Page or section header
<footer>    // Page or section footer
<ul> / <li> // Lists
<form>      // Forms
<label>     // Always pair with inputs
```

### Color and Contrast

Don't rely on color alone to convey meaning:

```tsx
// ❌ Only color indicates error
<input className="border-red-500" />

// ✅ Color + text
<input className="border-destructive" />
<p className="text-sm text-destructive">Title is required</p>
```

### Reduced Motion

Respect user preference:

```tsx
<div className="animate-in fade-in motion-reduce:animate-none">
```

---

## Anti-Patterns

### Avoid

```tsx
// Heavy shadows
shadow-2xl

// Excessive border radius
rounded-3xl rounded-full  // on rectangles

// Multiple accent colors competing
<Button className="bg-purple-500">
<Button className="bg-teal-500">
<Button className="bg-pink-500">

// Decorative gradients
bg-gradient-to-r from-purple-500 to-pink-500

// Animation everywhere
animate-bounce animate-pulse  // on standard UI elements

// Asymmetric padding without reason
p-4 pr-8 pb-2
```

### Prefer

```tsx
// Subtle elevation
shadow-sm border

// Consistent radii
rounded-md rounded-lg

// Single accent via semantic tokens
bg-primary

// Targeted, purposeful animation
transition-colors hover:bg-accent

// Symmetric padding
p-4  or  px-4 py-3  // intentional asymmetry only
```

---

## Quality Checklist

Before delivering UI code:

- [ ] Can a new user understand the interface in 5 seconds?
- [ ] Is the primary action obvious and prominent?
- [ ] Is there clear visual hierarchy (headings, spacing, color)?
- [ ] Are interactive elements obviously clickable?
- [ ] Have loading, error, and empty states been considered?
- [ ] Is there visual feedback for all interactions?
- [ ] Are focus states visible for keyboard navigation?
- [ ] Are semantic HTML elements used correctly?
- [ ] Do all colors use semantic tokens (not hardcoded)?
- [ ] Does it work in both light and dark mode?
