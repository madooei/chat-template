# Technology Philosophy

This document explains _why_ we chose every piece of this stack. Not just what we use, but the reasoning behind it. If you understand the philosophy, you can make good decisions when extending or adapting this template.

## The Core Principle

**Stable, small, AI-friendly tools that compose well and don't fight you.**

This repo is optimized from the start to work with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as the primary development tool. Every technology choice, every architectural pattern, and the folder structure itself are designed so that Claude Code can reason about the entire system and generate correct, consistent code. The `.claude/skills/` directory encodes our conventions as executable knowledge — when you ask Claude Code to add a feature, it follows the same patterns a human would, because those patterns are explicitly documented where the AI can find them.

We're optimizing for a sweet spot between three tensions:

- **Modern enough** to be relevant and enjoyable to use
- **Stable enough** that the ground doesn't shift under your feet every 6 months
- **Simple enough** that both students and AI can reason about the whole system

## The Stack, and Why

### TypeScript over JavaScript

Not even close. Types are documentation that the compiler enforces. For AI-assisted development this matters even more — types give Claude context about what's expected, so it generates correct code more often. A student reading unfamiliar code can follow the types like a map. The cost is near zero with modern tooling.

### Node over Deno/Bun

Boring in the best way. Deno and Bun are interesting experiments but they're still chasing stability. Node's ecosystem is massive, every tutorial assumes it, every CI system supports it natively. When you hit a problem, there are a million Stack Overflow answers. For a teaching template, reliability of the surrounding ecosystem matters more than runtime speed.

### Vite over Webpack/Turbopack/etc.

Fast, minimal config, just works. ESLint + Prettier are non-negotiable hygiene — they remove style debates entirely. A `validate` script (`type-check && lint`) is the right pattern: catch errors before they become bugs.

### React over Vue/Svelte/etc.

This is pragmatic, not tribal. React has the largest corpus of training data for AI models, period. Claude generates better React than anything else because it's seen more of it. The job market is still dominated by React. And despite the server components mess, the core mental model (components, props, hooks) has been stable since 2019. You don't have to use the new stuff.

### No Frameworks (No Next, No Astro, No Remix)

This is the key philosophical choice. Frameworks are opinions about your entire architecture. Next.js in particular has become a moving target — App Router vs Pages Router, server components, server actions, caching behaviors that change between minor versions. It's maddening.

But more importantly: **a framework couples your frontend to deployment and backend assumptions**. This template is Act 1 of a 3-act play. If you start with Next, you've already made backend decisions. Plain Vite + React is a blank canvas — it builds to static files, runs anywhere, and imposes nothing about where data comes from.

### Nanostores over React Query / React Router / Zustand / Redux

This is the most interesting choice. Nanostores is:

- **Tiny** — the whole thing is ~1KB
- **Framework-agnostic** — works with React, Vue, Svelte, vanilla JS
- **Stable** — the API hasn't meaningfully changed
- **Composable** — atoms, computed, persistent, router are all separate small packages you opt into

But the real reason is **the abstraction boundary it creates**. The hooks (`useQueryChats`, `useMutationChat`) are a thin layer over the store. Right now the store reads/writes localStorage. In Act 2, you swap the store internals to call a real backend, and the hooks + components don't change. React Query is great, but it assumes a fetch-based data model. Nanostores assumes nothing.

### Tailwind + shadcn

Tailwind is utility-first CSS that reads like inline styles but produces optimized output. AI models are very good at generating Tailwind because the class names are self-describing. shadcn is not a dependency — it's copy-pasted components you own and can modify. No version lock-in, no breaking changes from upstream. And the combination has massive representation in AI training data.

### prompt-kit for AI UI Primitives

Building chat UI from scratch means solving the same problems everyone else has already solved — message bubbles, streaming indicators, auto-scrolling chat containers, markdown rendering, code blocks with syntax highlighting. prompt-kit solves this the same way shadcn does: copy-pasted components you own and can modify, not a dependency you're locked into.

It fits the philosophy perfectly:

- **Built on what we already use** — it's built on top of Tailwind and shadcn, so it doesn't introduce a new styling system or component model
- **Primitives, not a framework** — each component (Message, ChatContainer, PromptInput, Markdown, CodeBlock, Loader, etc.) is independent. Use what you need, ignore the rest
- **Copy-paste ownership** — components live in `src/components/prompt-kit/` and you can modify them freely. No version lock-in, no upstream breaking changes
- **AI-chat-specific** — these components encode patterns that are specific to AI chat interfaces (streaming text, reasoning blocks, tool call visualization, scroll-to-bottom behavior) so we don't reinvent them
- **AI-friendly** — well-represented in training data, TypeScript-first, and the component APIs are self-describing

The key insight: we still own every line of UI code. prompt-kit just gives us a better starting point than a blank file for the parts that are specific to AI chat.

### Vercel AI SDK for AI Provider Abstraction

The app is a "bring your own AI" chat UI — users pick a provider, supply their own API key (stored in localStorage), and chat. We need a thin abstraction over multiple AI providers (OpenAI, Anthropic, Google, etc.) that handles the common plumbing: streaming responses, message formatting, provider-specific adapters. Vercel AI SDK fits the heuristic well:

- **Stable** — the core API (`streamText`, provider adapters) has been consistent and well-maintained
- **Small** — the core `ai` package does one thing: normalize the interface to language models. Provider adapters (`@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.) are separate small packages you opt into
- **AI-friendly** — heavily represented in training data, well-documented, TypeScript-first
- **Swappable** — it's an abstraction layer, not a framework. It doesn't own your state or your UI. If something better comes along, the surface area to replace is small
- **Teachable** — the mental model is simple: pick a provider, call `streamText`, get back a stream

Critically, it doesn't fight the architecture. The SDK handles the AI provider communication; nanostores and hooks handle the state and UI. Each does its job without stepping on the other.

## The Three Acts

This template is designed to evolve in three stages:

1. **Act 1 — Frontend only, with AI.** React + Vite + nanostores with localStorage persistence, plus Vercel AI SDK for provider-agnostic chat. Users bring their own API key, pick a provider, and chat — all running locally with no backend. You learn the patterns — feature modules, stores, hooks, components — and get a working AI chat UI without any infrastructure noise.

2. **Act 2 — Bring a backend.** Swap the store layer to talk to a real backend (Convex). Because the abstraction boundary is clean, hooks and components don't change. You learn how a reactive backend integrates with a frontend you already understand.

3. **Act 3 — Agentic AI.** Integrate an agentic AI framework (Mastra). Act 1 gave you basic chat. Act 2 gave you persistence and a real backend. Now you add tools, memory, and autonomous agent behavior on top of a foundation you fully understand.

Each act builds on the last. Nothing gets thrown away.

## The Design Principle

If we had to summarize it in one sentence:

> **Feature-based modules with a clean abstraction boundary between "what the UI does" and "where data comes from."**

The folder structure (`types/ → store/ → hooks/ → components/ → pages/`) is a pipeline:

1. **Types** — Define the shape of your data
2. **Store** — Manage the state (this is what you swap between acts)
3. **Hooks** — Expose state to React (thin adapters, not business logic)
4. **Components** — Render the UI (no direct store access)
5. **Pages** — Compose components into views

Each layer only talks to the one below it. Swap the store, everything above still works.

## AI-Assisted Development

This template is also designed to be built _with_ AI. We use Claude Code as our coding agent, with skills that encode these patterns. The skills serve two purposes:

1. **Teaching** — They explain _why_ we do things a certain way, so you learn the reasoning
2. **Consistency** — They guide the AI to generate code that follows our conventions

When you ask Claude Code to add a feature, the skills ensure it produces code that fits the architecture. When you read the skills, you learn the architecture. Same artifact, two audiences.

## Testing

### Why Vitest

Vitest is native to Vite — it reuses the same config, aliases, and transforms, so there's zero extra bundler configuration. Its API is Jest-compatible, which means massive AI training data and instant familiarity for anyone who's tested JavaScript before. It's ESM-native, fast, and does one thing well: run unit and integration tests.

### Why React Testing Library

React Testing Library tests components the way users use them — through observable behavior, not implementation details. You query by role, label, and text, not by CSS class or component internals. This aligns naturally with the SPEC.md approach where "Key Behaviors" map directly to test cases. It's the de facto standard for React testing.

### Why Playwright

Playwright runs real browser E2E tests. Microsoft-backed, stable, TypeScript-first, with an API that reads like English (`page.click`, `expect(page).toHaveURL`). Good CLI and MCP integration for AI-assisted development. We use Chromium-only to keep the test matrix simple.

### The Testing Pyramid

The pyramid maps directly to the architecture:

| Layer          | Tool                                | What you test                                                                   |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| **Stores**     | Vitest                              | Pure function logic — add, remove, update, Zod decode safety                    |
| **Hooks**      | Vitest + `renderHook`               | React integration — query hooks return store data, mutation hooks modify stores |
| **Components** | Vitest + RTL `render` + `userEvent` | User interactions — click, type, submit, conditional rendering                  |
| **E2E**        | Playwright                          | Full browser journeys — create chat, send message, change settings              |

Each layer tests different concerns. Stores are pure functions (no React). Hooks need `renderHook` but no DOM. Components need a DOM but no real browser. E2E needs a real browser but tests the whole system.

### What We Don't Test

Third-party code. We own the shadcn and prompt-kit files (they live in `src/components/`), but they're copies of upstream libraries. We test _our usage_ of these components — that our props work, our callbacks fire, our composition renders — not the internals of Radix UI or prompt-kit itself.

## The Guiding Heuristic

When choosing a technology or pattern, ask:

- **Is it stable?** Has the API been consistent for at least a year?
- **Is it small?** Does it do one thing well, or is it a kitchen sink?
- **Is it AI-friendly?** Is there enough training data that Claude can generate correct code with it?
- **Is it swappable?** Can I replace it without rewriting everything above it?
- **Is it teachable?** Can a student understand the whole thing, not just their corner of it?

If most answers are yes, it's a strong candidate. If one is no, there should be a clear pragmatic reason — the way React fails "small" and "teachable" but wins on ecosystem, AI training data, and job market relevance. The heuristics are weighted, not binary. No tool is perfect; the question is whether the tradeoffs are deliberate and justified.
