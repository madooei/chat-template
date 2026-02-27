# Technology Decisions

This document explains _why_ we chose every piece of this stack. Not just what we use, but the reasoning behind it. If you understand the philosophy, you can make good decisions when extending or adapting this template.

## The Core Principle

**Stable, small, AI-friendly tools that compose well and don't fight you.**

This repo is optimized from the start to work with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as the primary development tool. Every technology choice, every architectural pattern, and the folder structure itself are designed so that Claude Code can reason about the entire system and generate correct, consistent code. The `.claude/skills/` directory encodes our conventions as executable knowledge — when you ask Claude Code to add a feature, it follows the same patterns a human would, because those patterns are explicitly documented where the AI can find them.

We're optimizing for a sweet spot between three tensions:

- **Modern enough** to be relevant and enjoyable to use
- **Stable enough** that the ground doesn't shift under your feet every 6 months
- **Simple enough** that both students and AI can reason about the whole system

## Development Tooling, and Why

### Claude Code as the Development Agent

This template is designed to be built _with_ AI, not just _for_ AI. Claude Code is an agentic coding tool that lives in the terminal, reads your codebase, and makes changes across files. We chose it over alternatives (Copilot, Cursor, Windsurf, etc.) for a specific reason: **it's the only tool where you can encode project conventions as executable knowledge**.

The `.claude/rules/` directory contains constraints (branch naming, commit format, PR conventions) that Claude Code follows automatically. The `.claude/skills/` directory contains deeper patterns (how to create a feature module, how to write tests, how to structure state) that Claude Code consults when generating code. This means the AI doesn't just autocomplete — it understands the architecture and produces code that fits.

For a collaborative course project, this solves a real problem: consistency across team members. Every student's AI assistant follows the same conventions, generates the same patterns, and references the same architectural decisions. The skills also serve as teaching material — reading them teaches you the "why" behind each pattern.

### GitHub for Collaboration (Issues, PRs, Actions)

GitHub is the platform for version control, project management, and CI/CD. This is pragmatic:

- **Issues as the task system** — GitHub Issues with labels (`feature`, `bug`, `task`), milestones, and templates give structure to collaborative work without introducing a separate tool. The `.github/ISSUE_TEMPLATE/` directory provides templates for features, bugs, tasks, and retrospectives so every issue follows a consistent format.
- **Pull requests as the review gate** — PRs enforce code review before merging to `master`. The `.github/PULL_REQUEST_TEMPLATE.md` standardizes what reviewers need to see. Branch protection rules prevent direct pushes.
- **Actions for CI/CD** — GitHub Actions runs type-checking, linting, and tests on every PR (CI), and builds + deploys on every merge to `master` (CD). It's integrated into the same platform where code lives — no separate Jenkins, CircleCI, or Travis setup. The free tier is generous enough for course projects.
- **Ubiquity** — every developer will encounter GitHub professionally. Learning its workflow (branch, commit, PR, review, merge) is transferable knowledge. Claude Code's `gh` CLI integration means the AI can create issues, open PRs, and check CI status without leaving the terminal.

The GitHub CLI (`gh`) is a prerequisite for this project. It allows Claude Code's skills to automate issue creation, PR workflows, and milestone management directly from the command line.

### Netlify for Deployment

The app builds to static files (`dist/`), so it needs a static hosting platform. Netlify fits because:

- **Zero config for static sites** — point it at a `dist/` folder and it works. No Dockerfile, no server configuration, no infrastructure to manage.
- **SPA support** — a single `_redirects` file handles client-side routing. Without this, refreshing on `/settings` would 404. Netlify makes this a one-line fix.
- **GitHub Actions integration** — the `nwtgck/actions-netlify` action deploys in one step. Two secrets (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`) and you're done.
- **Free tier** — more than sufficient for course projects. No credit card required for basic hosting.
- **Preview deploys** — PRs can get their own deploy preview URLs, so reviewers can test changes in a real browser before merging (optional, not enabled by default).

We deliberately keep deployment simple in Phase 1. The CD workflow is ~30 lines of YAML. In Phase 2, when a backend (Convex) enters the picture, the build step adds a Convex deploy command — but the Netlify deployment itself stays the same.

## The App Stack, and Why

### TypeScript over JavaScript

Not even close. Types are documentation that the compiler enforces. For AI-assisted development this matters even more — types give Claude context about what's expected, so it generates correct code more often. A student reading unfamiliar code can follow the types like a map. The cost is near zero with modern tooling.

### Node over Deno/Bun

Boring in the best way. Deno and Bun are interesting experiments but they're still chasing stability. Node's ecosystem is massive, every tutorial assumes it, every CI system supports it natively. When you hit a problem, there are a million Stack Overflow answers. For a teaching template, reliability of the surrounding ecosystem matters more than runtime speed.

### Vite over Webpack/Turbopack/etc.

Fast, minimal config, just works. ESLint + Prettier are non-negotiable hygiene — they remove style debates entirely. A `validate` script (`type-check && lint`) is the right pattern: catch errors before they become bugs.

### React over Vue/Svelte/etc.

This is pragmatic, not tribal. React has the largest corpus of training data for AI models, period. Claude generates better React than anything else because it's seen more of it. The job market is still dominated by React. And despite the server components mess, the core mental model (components, props, hooks) has been stable since 2019. You don't have to use the new stuff.

### No Frameworks (No Next, No TanStack Start, No Remix, No Astro, ...)

This is the key philosophical choice. Frameworks are opinions about your entire architecture. Next.js in particular has become a moving target — App Router vs Pages Router, server components, server actions, caching behaviors that change between minor versions. It's maddening.

But more importantly: **a framework couples your frontend to deployment and backend assumptions**. This template is Phase 1 of a 4-phase progression. If you start with Next, you've already made backend decisions. Plain Vite + React is a blank canvas — it builds to static files, runs anywhere, and imposes nothing about where data comes from.

### Legend-State over Tanstack (React) Query / Zustand / Redux

This is the most interesting choice. Legend-State is:

- **Fine-grained** — signals-based reactivity with minimal re-renders
- **Framework-agnostic** — works with React, Vue, Svelte, vanilla JS
- **Sync-ready** — built-in persistence, debouncing, retry, and sync engine for local-first patterns
- **Composable** — observables compose naturally; persistence is opt-in per store

But the real reason is **the abstraction boundary it creates**. The hooks (`useQueryChats`, `useMutationChat`) are a thin layer over the store. Right now the store reads/writes IndexedDB. In Phase 2, you swap the store internals to use Legend-State's sync engine with a real backend, and the hooks + components don't change. React Query is great, but it assumes a fetch-based data model. Legend-State assumes nothing — and when you need debounced sync, server reconciliation, or optimistic updates, it's already there.

### Wouter over React Router / Tanstack Router

Wouter handles routing — it's ~1.3KB, zero dependencies, and treats routing as state with idiomatic React hooks (`useLocation`, `useRoute`) and JSX components (`<Route>`, `<Switch>`). React Router is the default choice in most React projects, but it's grown into a framework-adjacent tool with loaders, actions, and data APIs that overlap with your state management. Wouter does one thing — match URLs to components — and stays out of the way. For a template that already has Legend-State managing data, a minimal router that doesn't try to own your data layer is the right fit.

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

Critically, it doesn't fight the architecture. The SDK handles the AI provider communication; Legend-State observables and hooks handle the state and UI. Each does its job without stepping on the other.

### OpenRouter as the Default Provider

Vercel AI SDK gives us provider abstraction. OpenRouter gives us provider _aggregation_. Instead of managing separate API keys for OpenAI, Anthropic, Google, and Meta, students get one key that routes to all of them. This matters for a teaching context:

- **One key, many models** — students sign up once and can experiment with Claude, GPT-4o, Gemini, Llama, and others without juggling multiple accounts and billing setups
- **Consistent billing** — one dashboard, one credit balance, no surprise charges across five different providers
- **Low friction** — the biggest barrier to students building with AI is the API key setup. OpenRouter reduces that to a single registration
- **Model discovery** — students can compare models side-by-side without committing to a provider. Try Claude for reasoning, GPT-4o for general tasks, Llama for cost-sensitive use cases — all through the same endpoint

We pair it with the `@openrouter/ai-sdk-provider` adapter, which plugs directly into Vercel AI SDK's `streamText`. The integration is a single function call — swap the provider argument and everything else stays the same.

### Vitest + React Testing Library for Unit/Integration Tests

Vitest is native to Vite — it reuses the same config, aliases, and transforms, so there's zero extra bundler configuration. Its API is Jest-compatible, which means massive AI training data and instant familiarity. React Testing Library tests components through observable behavior (roles, labels, text), not implementation details. Together they cover stores, hooks, and components without needing a real browser.

### Playwright for E2E Tests

Playwright runs real browser tests. Microsoft-backed, stable, TypeScript-first, with an API that reads like English. We use Chromium-only to keep the test matrix simple. Playwright ships with an MCP server and we pair it with three Claude Code agents (planner, generator, healer) so you can describe a user journey in plain English and have the AI write, run, and fix the E2E test — same AI-assisted philosophy as the rest of the stack.

### Convex as the Backend (Phase 2)

Phase 1 runs entirely in the browser — IndexedDB is the database. Phase 2 introduces a real backend, and we chose Convex over alternatives (Supabase, Firebase, PocketBase, a custom Express/Fastify server) for reasons that align with the template's philosophy:

- **Pure TypeScript, one folder** — the entire backend lives in a single `convex/` directory alongside your frontend code. Schema definitions, server functions, cron jobs, HTTP endpoints — all TypeScript, all in one place. No separate backend repo, no second language, no context-switching. The same TypeScript skills students use for React apply directly to the backend.
- **End-to-end type safety** — Convex schemas define tables, fields, and indexes in TypeScript. The `npx convex dev` command generates typed API bindings, so the type system flows unbroken from schema definition through server functions to frontend hooks. No ORM, no migrations, no manual type duplication — the schema _is_ the source of truth and TypeScript enforces it everywhere.
- **Reactive by default** — Convex queries are live. When data changes on the server, every client subscribed to that query updates automatically via the `useQuery` hook. This maps perfectly to Legend-State's observable model: swap the store internals from IndexedDB reads to Convex subscriptions, and the hooks + components don't change. No polling, no cache invalidation, no manual refetching.
- **First-class React integration** — Convex provides `useQuery` and `useMutation` hooks that feel native to React. Components subscribe to server-side queries and get automatic re-renders when data changes. The mental model is "call a function, get data" — the same mental model as calling a store function in Phase 1.
- **Built-in auth** — Convex Auth provides both anonymous and password authentication out of the box. Users can sign in with email/password or continue as a guest via anonymous sign-in. Both providers are always registered; the auth page lets users choose their preferred method.
- **HTTP actions with Hono** — for SSE streaming (the AI chat endpoint), Convex supports HTTP actions using Hono as the router. This means the streaming endpoint lives alongside the reactive queries and mutations in the same codebase, same deployment, same auth context. No separate API server to deploy and maintain.
- **Batteries included** — Convex provides built-in file storage (upload, download, manage files without a separate S3 bucket), cron jobs (schedule recurring functions with seconds-level granularity), and scheduled functions (durable one-off execution minutes, days, or months in the future). These are features that typically require stitching together multiple services — here they're part of the same platform, same TypeScript codebase, same deployment.
- **AI-native features** — Convex has built-in vector search, effectively giving you a vector database without adding another service. You can store embeddings alongside your regular data and query them by semantic similarity — the foundation for RAG, recommendations, and semantic search. Vector indexes support millions of vectors and are consistent with the rest of your data (write a vector, immediately query it).
- **Components for extensibility** — Convex has a component system that extends the platform's capabilities. The **Agent component** (`@convex-dev/agent`) is particularly relevant: it manages threads, messages, and conversation context for AI agents, with built-in hybrid vector/text search and RAG integration. The **RAG component** provides semantic search with configurable embedding models, namespaces, and importance weighting. The **Workflow component** enables durable multi-step workflows with retries and load balancing. These are separable pieces — use what you need for each phase.
- **Zero infrastructure** — no database to provision, no server to deploy, no connection pooling to configure. `npx convex dev` starts a development backend. `npx convex deploy` ships to production. For a course project, this removes an entire category of operational complexity.
- **AI-friendly** — Convex has good TypeScript types, a clear function model, and growing representation in AI training data. The patterns are regular enough (schema → guards → helpers → functions) that Claude Code generates correct Convex code consistently.

Convex is open source (FSL Apache 2.0, converting to full Apache 2.0 two years after release). The backend, dashboard, client libraries, and CLI are all open source, and you can self-host via Docker if you want full control. For this template we use Convex Cloud because it eliminates operational complexity — but there's no lock-in. If you outgrow the hosted service or need to run on your own infrastructure, the self-hosted path exists with the same codebase the cloud service runs.

### Mastra as the Agentic Framework (Phase 3)

Phase 2 gave us a real backend with server-side AI calls through OpenRouter. Phase 3 adds agentic capabilities — agents that can use tools, maintain memory, and orchestrate multi-step workflows. We chose [Mastra](https://mastra.ai/) over alternatives (LangChain, CrewAI, AutoGen, building from scratch with the AI SDK) for reasons that align with the template's philosophy:

- **Pure TypeScript, code-first** — agents, tools, and workflows are defined as TypeScript code. No YAML configs, no drag-and-drop builders, no DSLs. The same language students use for React and Convex extends to agent definitions. If you can write a function, you can write a tool. If you can define a class, you can define an agent.
- **Composable primitives** — Mastra provides five building blocks: Agents (LLM + instructions + tools), Tools (Zod-validated functions agents can call), Workflows (multi-step orchestrations with suspend/resume), Memory (conversation history with optional semantic recall), and Storage (pluggable persistence). Each is independent — use agents without workflows, tools without memory, or the full stack together. No all-or-nothing commitment.
- **Built on the AI SDK** — Mastra uses Vercel AI SDK for model communication, the same SDK we already use in Phase 2 for direct chat. This means the same `streamText` patterns, the same provider adapters, and the same mental model. Adding Mastra doesn't introduce a second way of talking to LLMs — it extends the one we already have with agent capabilities on top.
- **Runs as a separate server** — Mastra builds to a standalone HTTP server with streaming endpoints for each agent. This keeps it cleanly separated from the Convex backend. The Convex backend calls Mastra via HTTP (using `MastraClient`), and the Mastra server handles agent orchestration, tool execution, and memory. Each service has one job.
- **Built-in dev tooling** — `npx mastra dev` starts a development server with a Studio UI at `localhost:4111`. You can test agents interactively, inspect tool calls, and debug workflows without running the full app. This tight feedback loop matters when iterating on agent behavior.
- **Flexible deployment** — Mastra Cloud offers managed hosting for quick setup. For more control, `npx mastra build` produces a plain Node.js server you can deploy anywhere (Railway, Render, Fly.io). There's also a Netlify Functions deployer for colocation with the frontend. Three options from zero-ops to full control.
- **Not a platform, just a package** — Mastra is an open-source npm package (Apache 2.0), not a hosted platform you depend on. Mastra Cloud is optional managed hosting. You can run the same code on your own infrastructure with no vendor lock-in. This matters for a teaching context — students learn transferable patterns, not a specific vendor's API.
- **MCP documentation server** — Mastra ships with `@mastra/mcp-docs-server`, an MCP server that gives Claude Code direct access to Mastra's documentation, API references, and type definitions from your installed packages. When working on agents or tools, enabling this MCP gives Claude version-matched answers without web searches. It's configured in `.mcp.json` but disabled by default to save tokens — enable it via `/mcp` when you need it.

The architecture in Phase 3 is three cooperating services: the React frontend (Netlify) talks to the Convex backend, which talks to the Mastra server for agent tasks. The frontend never sees Mastra directly — the Mastra URL is a server-side environment variable on the Convex deployment. This keeps API keys server-side and gives Convex full control over when and how agent capabilities are invoked.

## The Phases

This template is designed to evolve in phases:

0. **Phase 0 — Project scaffolding.** A minimal repo with no tech stack decisions. It provides Claude Code rules and skills for collaborative software development — branch naming, commit conventions, PR workflows, iteration planning, retrospectives, and GitHub issue/PR templates. If you want to use your own stack, start here and build on top of it. Phase 0 is the foundation every other phase inherits.

1. **Phase 1 — Frontend only, with AI.** React + Vite + Legend-State with IndexedDB persistence, plus Vercel AI SDK for provider-agnostic chat. Users bring their own API key, pick a provider, and chat — all running locally with no backend. You learn the patterns — feature modules, stores, hooks, components — and get a working AI chat UI without any infrastructure noise.

2. **Phase 2 — Bring a backend.** Swap the store layer to talk to a real backend (Convex). Because the abstraction boundary is clean, hooks and components don't change. You learn how a reactive backend integrates with a frontend you already understand.

3. **Phase 3 — Agentic AI.** Integrate an agentic AI framework (Mastra). Phase 1 gave you basic chat. Phase 2 gave you persistence and a real backend. Now you add tools, memory, and autonomous agent behavior on top of a foundation you fully understand.

4. **Phase 4 — Production utilities.** Add the things a real app needs: authentication, rate limiting, error monitoring, and other operational concerns. These are layered on top of a system you already understand end-to-end, so each utility is a focused addition rather than a confusing cross-cutting change.

Each phase builds on the last. Nothing gets thrown away.

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

The backend follows the same principle — separation of concerns through a responsibility chain. All Convex files live flat at the root of `convex/`, using domain-prefixed names:

```plaintext
convex/
├── schema.ts                # Main schema (imports domain tables)
├── lib.ts                   # Auth wrappers (queryWithAuth, etc.)
├── {domain}_schema.ts       # Type hierarchy and table definition
├── {domain}_helpers.ts      # Pure database operations
├── {domain}_queries.ts      # Public read endpoints
├── {domain}_mutations.ts    # Public write endpoints
├── {domain}_guards.ts       # Authorization checks (optional)
├── auth.ts                  # Auth configuration
└── http.ts                  # HTTP endpoints (Hono router)
```

The pipeline is: **schema → guards → helpers → queries/mutations**. Schema defines the data shape. Guards verify authorization. Helpers do pure database operations. Queries and mutations are thin public endpoints that compose guards and helpers. The same layered thinking as the frontend — each file has one job, and you can read any domain top-to-bottom without jumping between directories.

Why flat files instead of nested folders? Convex uses file-based routing. Nesting creates verbose API paths (`api.chats.queries.getAll`). Flat files with domain prefixes keep it clean (`api.chats_queries.getAll`).

## AI-Assisted Development

As described in the [Claude Code](#claude-code-as-the-development-agent) section, this template is built _with_ AI. The skills in `.claude/skills/` serve two audiences: they guide Claude Code to generate consistent code, and they teach students the reasoning behind each pattern. Same artifact, two purposes.

## The Guiding Heuristic

When choosing a technology or pattern, ask:

- **Is it stable?** Has the API been consistent for at least a year?
- **Is it small?** Does it do one thing well, or is it a kitchen sink?
- **Is it AI-friendly?** Is there enough training data that Claude can generate correct code with it?
- **Is it swappable?** Can I replace it without rewriting everything above it?
- **Is it teachable?** Can a student understand the whole thing, not just their corner of it?

If most answers are yes, it's a strong candidate. If one is no, there should be a clear pragmatic reason — the way React fails "small" and "teachable" but wins on ecosystem, AI training data, and job market relevance. The heuristics are weighted, not binary. No tool is perfect; the question is whether the tradeoffs are deliberate and justified.
