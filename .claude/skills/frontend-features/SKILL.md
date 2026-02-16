---
name: frontend-features
description: Guide for creating and structuring frontend features. Use when creating new features, refactoring existing features, adding functionality to existing features, organizing code by feature, or asking about feature directory structure, file organization, or import patterns.
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

# Frontend Features Guide

Patterns for creating and organizing feature modules in the frontend codebase.

## Related Skills

- **[frontend-types](../frontend-types/SKILL.md)** — Type definitions and Zod schemas
- **[frontend-state](../frontend-state/SKILL.md)** — State management with nanostores
- **[frontend-hooks](../frontend-hooks/SKILL.md)** — Hook patterns for data and logic
- **[frontend-components](../frontend-components/SKILL.md)** — UI component patterns
- **[frontend-routing](../frontend-routing/SKILL.md)** — Routing and navigation
- **[frontend-design](../frontend-design/SKILL.md)** — Visual design and theming

---

## Quick Reference

| Topic         | File                         | Description            |
| ------------- | ---------------------------- | ---------------------- |
| **Structure** | [structure.md](structure.md) | Directory organization |
| **Imports**   | [imports.md](imports.md)     | Import conventions     |

---

## Why Feature-First?

Code is organized **by feature, not by type**. This means all the code for "chats" lives together in `src/chats/`, not scattered across `src/components/`, `src/hooks/`, `src/types/`, etc.

Why this matters:

- **Colocation** — When you work on a feature, everything you need is in one place
- **Isolation** — Features don't leak into each other. You can understand one without reading all of them
- **Swappability** — You can change how a feature works (e.g., swap its data source) without touching other features
- **AI-friendly** — When Claude Code works on a feature, it can read the whole feature directory and have full context

---

## Project Layout

```plaintext
src/
├── chats/                # Chat feature
│   ├── types/
│   ├── store/
│   ├── hooks/
│   ├── components/
│   └── pages/
├── messages/             # Messages feature
│   ├── types/
│   ├── store/
│   ├── hooks/
│   ├── components/
│   └── pages/
├── components/           # Shared components (used across features)
│   ├── ui/               # shadcn/ui primitives (button, tooltip, etc.)
│   ├── theme-toggle.tsx
│   └── tooltip-button.tsx
├── hooks/                # Shared hooks
├── store/                # Shared stores
├── types/                # Shared types
├── lib/                  # Shared utilities
├── config/               # App configuration
├── layout/               # Layout components (header, footer, shell)
├── styles/               # Global CSS
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

Features live as **top-level directories** under `src/`. Shared code lives in generic directories (`components/`, `hooks/`, `lib/`, etc.) also under `src/`.

---

## Feature Structure

Each feature follows the `types/ → store/ → hooks/ → components/ → pages/` pipeline. Create only the subdirectories you need:

| Directory     | Purpose               | When to Create                          |
| ------------- | --------------------- | --------------------------------------- |
| `types/`      | Zod schemas and types | Almost always — defines the data shape  |
| `store/`      | Nanostores state      | When the feature manages its own state  |
| `hooks/`      | Custom React hooks    | When components need data or logic      |
| `components/` | React components      | Always — features need UI               |
| `pages/`      | Route page components | When the feature has navigable views    |
| `lib/`        | Utilities, helpers    | When you need pure functions, constants |

---

## Key Principles

1. **Feature-first** — Organize by feature, not by type
2. **Colocation** — Keep related code together in the same feature directory
3. **Direct imports** — Import from specific files, not barrel files at feature root
4. **Pipeline order** — `types/ → store/ → hooks/ → components/ → pages/` — each layer depends only on the layers before it
5. **No root barrel files** — Don't create `index.ts` at the feature root. Import directly from the file you need

---

## When to Put Code in Shared

**Put in shared (`src/components/`, `src/hooks/`, etc.) when:**

- Used by 3+ features
- Truly generic (no feature-specific logic)
- Stable API unlikely to change with any single feature

**Keep in the feature when:**

- Used by 1-2 features
- Contains feature-specific logic
- Likely to evolve with the feature

When in doubt, keep it in the feature. You can always promote it to shared later.

---

## Checklist for New Features

- [ ] Create `src/{feature-name}/` directory
- [ ] Add only the subdirectories you need
- [ ] Define data shapes in `types/` with Zod schemas
- [ ] Create store in `store/` if the feature has its own state
- [ ] Create hooks in `hooks/` for data access and mutations
- [ ] Create components in `components/`
- [ ] Add page components in `pages/` if the feature has routes
- [ ] Update the router in `src/chats/store/router.ts` if adding routes
- [ ] Update `src/App.tsx` if adding new pages
- [ ] Do NOT create `index.ts` at feature root

---

## Detailed Documentation

- [structure.md](structure.md) — Full directory structure with examples from this codebase
- [imports.md](imports.md) — Import conventions, ordering, and patterns
