---
name: frontend-prompt-kit
description: Working with prompt-kit AI chat components. Use when adding new prompt-kit components, customizing existing ones, troubleshooting prompt-kit issues, or asking about available AI UI primitives (messages, chat containers, markdown, code blocks, loaders, prompt inputs, etc.).
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

# prompt-kit Guide

How to work with prompt-kit components in this project.

## Related Skills

- **[frontend-components](../frontend-components/SKILL.md)** — General component patterns and shadcn/ui usage
- **[frontend-design](../frontend-design/SKILL.md)** — Visual design and layout patterns

---

## What is prompt-kit?

prompt-kit is a set of copy-paste UI primitives for AI chat interfaces, built on top of Tailwind and shadcn/ui. It provides components like Message, ChatContainer, PromptInput, Markdown, CodeBlock, Loader, ScrollButton, etc.

Like shadcn, you **own the code**. Components are copied into `src/components/prompt-kit/` and modified to fit our app. There is no npm dependency on prompt-kit itself.

---

## Critical: Installation Does NOT Work via CLI

**Do not attempt any of the following — they will fail:**

```bash
# ❌ shadcn CLI — registry returns 429
npx shadcn@latest add "https://prompt-kit.com/c/loader.json"

# ❌ Docs site — blocks programmatic access (429)
curl https://www.prompt-kit.com/docs/introduction
curl https://www.prompt-kit.com/llms.txt
```

The prompt-kit documentation site and component registry aggressively rate-limit automated requests. The shadcn CLI installation commands shown in their docs **do not work** in practice.

---

## How to Add a New prompt-kit Component

### Step 1: Get the source from GitHub

The source of truth is the GitHub repository. Fetch the raw file:

```
https://raw.githubusercontent.com/ibelick/prompt-kit/main/components/prompt-kit/{component-name}.tsx
```

Available components in the repo (as of last check):

| Component         | File                    | Description                              |
| ----------------- | ----------------------- | ---------------------------------------- |
| chat-container    | `chat-container.tsx`    | Auto-scrolling chat wrapper              |
| code-block        | `code-block.tsx`        | Syntax-highlighted code with copy button |
| loader            | `loader.tsx`            | 12 loading animation variants            |
| markdown          | `markdown.tsx`          | Memoized markdown renderer               |
| message           | `message.tsx`           | Message bubble with avatar and actions   |
| prompt-input      | `prompt-input.tsx`      | Auto-resizing textarea with actions      |
| prompt-suggestion | `prompt-suggestion.tsx` | Clickable suggestion pills               |
| scroll-button     | `scroll-button.tsx`     | Scroll-to-bottom floating button         |
| reasoning         | `reasoning.tsx`         | Collapsible AI reasoning display         |
| response-stream   | `response-stream.tsx`   | Client-side streaming text simulation    |
| file-upload       | `file-upload.tsx`       | Drag-and-drop file upload                |
| tool              | `tool.tsx`              | Tool call visualization                  |
| source            | `source.tsx`            | Source citation display                  |
| jsx-preview       | `jsx-preview.tsx`       | JSX string renderer                      |
| chain-of-thought  | `chain-of-thought.tsx`  | Chain of thought display                 |
| feedback-bar      | `feedback-bar.tsx`      | User feedback component                  |
| image             | `image.tsx`             | Image display component                  |
| steps             | `steps.tsx`             | Step-by-step display                     |
| system-message    | `system-message.tsx`    | System message display                   |
| text-shimmer      | `text-shimmer.tsx`      | Shimmer text effect                      |
| thinking-bar      | `thinking-bar.tsx`      | Thinking indicator bar                   |

### Step 2: Copy to `src/components/prompt-kit/`

Place the file in `src/components/prompt-kit/{component-name}.tsx`.

### Step 3: Clean up and adapt

Every component pulled from prompt-kit needs these adaptations:

#### Import paths

The original uses `@/components/ui/*` and `@/lib/utils` — these already match our project structure. But check for:

- **Internal prompt-kit references**: e.g., `import { Markdown } from "./markdown"` — these are fine if you already have the dependency component, otherwise pull that too.
- **shadcn/ui components you don't have yet**: If the component imports from `@/components/ui/avatar` and you don't have it, install it with `npx shadcn@latest add avatar`.

#### `"use client"` directive

The original prompt-kit components include `"use client"` at the top because they target Next.js. **This is unnecessary in our Vite + React setup** but harmless — you can leave it or remove it. Be consistent with what's already in the project.

#### App-specific adaptations

Some components may need deeper changes to integrate with our app:

- **code-block.tsx**: The local version imports `useTheme` from `@/hooks/use-theme` to switch Shiki themes based on light/dark mode. The original does not have this.
- **message.tsx**: The local version adjusts base styling classes (e.g., adding `prose prose-neutral break-words whitespace-normal`).
- **scroll-button.tsx**: Imports `buttonVariants` from our extracted `@/components/ui/button-variants` module.

These kinds of adaptations are expected and encouraged — the whole point is to own and customize the components.

#### Dependencies

Check if the component needs npm packages you don't have:

| Component      | Dependencies                                              |
| -------------- | --------------------------------------------------------- |
| markdown       | `react-markdown`, `remark-gfm`, `remark-breaks`, `marked` |
| code-block     | `shiki`                                                   |
| chat-container | `use-stick-to-bottom`                                     |
| scroll-button  | `use-stick-to-bottom`                                     |
| jsx-preview    | `react-jsx-parser`                                        |

#### Keyframe animations

Some components (especially `loader.tsx`) require custom CSS keyframe animations. These should be added to `src/styles/index.css`. Check the component source for `animate-[...]` class patterns and ensure the corresponding `@keyframes` exist.

---

## Currently Installed Components

These prompt-kit components are already in the project at `src/components/prompt-kit/`:

- `chat-container.tsx` — Auto-scrolling chat wrapper using `use-stick-to-bottom`
- `code-block.tsx` — Syntax-highlighted code blocks with Shiki and copy button
- `loader.tsx` — Loading animation variants (typing, dots, shimmer, etc.)
- `markdown.tsx` — Memoized markdown rendering with GFM support
- `message.tsx` — Message bubbles with avatar, markdown content, and action tooltips
- `prompt-input.tsx` — Auto-resizing textarea with submit and action slots
- `prompt-suggestion.tsx` — Clickable prompt suggestion pills with highlight mode
- `scroll-button.tsx` — Floating scroll-to-bottom button for chat containers

---

## Using prompt-kit Components

Import from `@/components/prompt-kit/*`:

```typescript
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/prompt-kit/message";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/prompt-kit/prompt-input";
import { Markdown } from "@/components/prompt-kit/markdown";
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "@/components/prompt-kit/code-block";
import { Loader } from "@/components/prompt-kit/loader";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
```

These are **primitives** — compose them together in your feature components. They do not contain business logic.

---

## Reference Documentation

Since the docs site is not accessible programmatically, this skill folder contains manually copied documentation:

| File | Description |
| ---- | ----------- |
| [prompt-kit-llm.md](prompt-kit-llm.md) | Short summary — component overview, quick API reference |
| [prompt-kit-llm-full.md](prompt-kit-llm-full.md) | Full docs — detailed component APIs, props tables, examples |

Start with the short version. Use the full version when you need detailed prop tables or usage examples.

---

## Checklist for Adding a New prompt-kit Component

- [ ] Fetch source from GitHub raw URL (not the CLI or docs site)
- [ ] Place in `src/components/prompt-kit/{name}.tsx`
- [ ] Verify import paths resolve (`@/components/ui/*`, `@/lib/utils`, sibling `./` imports)
- [ ] Install any missing shadcn/ui dependencies (`npx shadcn@latest add {component}`)
- [ ] Install any missing npm dependencies
- [ ] Add required CSS keyframes to `src/styles/index.css` if needed
- [ ] Adapt styling to match the app's conventions (see existing components for reference)
- [ ] Test in both light and dark mode
