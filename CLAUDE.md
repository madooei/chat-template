# Project Configuration

**Important:** Run `pnpm validate` after you make any changes to the code. It runs the type-check, lint, and test commands.

## Project Description

An AI chat application with email/password and guest authentication, plus deep research capabilities. The Convex backend handles auth, data persistence, and SSE streaming of AI responses via OpenRouter. A Mastra agent server provides deep research: multi-step web search, evaluation, and report generation. Three services: Frontend (React/Vite) + Convex (backend) + Mastra (AI agents).

## Tech Stack

React 19, TypeScript, Vite, Convex, Hono, @convex-dev/auth, Mastra, Legend-State, Wouter, Tailwind CSS v4, shadcn/ui, prompt-kit, Vercel AI SDK, @openrouter/ai-sdk-provider, Vitest, Playwright

## Commands

- Install dependencies: `pnpm install`
- Run development server (backend + frontend): `pnpm run dev`
- Run frontend only: `pnpm run dev:frontend`
- Run backend only: `pnpm run dev:backend`
- Run Mastra dev server locally: `pnpm run dev:mastra`
- Run tests: `pnpm run test`
- Run tests in watch mode: `pnpm run test:watch`
- Run E2E tests: `pnpm run test:e2e`
- Run linter: `pnpm run lint`
- Run formatter: `pnpm run format`
- Type-check: `pnpm run type-check`
- Full validation (type-check + lint + test): `pnpm run validate`
- Build for production: `pnpm run build`

## Code Style

- Formatting: Prettier
- Linting: ESLint (with react-hooks and react-refresh plugins)
- Naming conventions: camelCase for variables/functions, PascalCase for components/types

## Architecture

Feature-based modules following a pipeline: `types/ → store/ → hooks/ → components/ → pages/`. Each layer only talks to the one below it.

```plaintext
convex/              # Convex backend (schema, queries, mutations, HTTP endpoints)
mastra/              # Mastra AI agent server (research agents, tools, workflows)
src/
├── store/           # Shared state utilities (persisted observable, theme)
├── chats/           # Chat feature (types, store, hooks, components, pages)
├── messages/        # Messages feature (same structure)
├── settings/        # Settings feature (same structure)
├── components/      # Shared UI (shadcn, prompt-kit)
├── config/          # App configuration constants
├── hooks/           # Shared React hooks (auth, theme, window size)
├── layout/          # App shell (header, sidebar)
├── lib/             # Utilities (Convex client, SSE consumer, cn helper)
├── test/            # Test setup and helpers
├── types/           # Shared types (theme only; feature types live in feature modules)
└── styles/          # Global CSS

e2e/                 # Playwright end-to-end tests
playwright-specs/    # Playwright E2E test plans
guides/              # How-to guides for students
docs/                # Iteration plans, PRD, team agreement
manuals/             # End-user manuals with screenshots
```

## Branch & Commit Conventions

- Branch pattern: `<author>/<type>/issue-<number>-<short-description>`
  - `type` must match the issue label: `feature`, `bug`, or `task`
- Never push directly to master
- Reference issues in commits: `Add file validation (#12)`
- Keep PRs under ~400 changed lines
- Use merge commits (no squash or rebase)

## Common Mistakes

- [ ] Forgetting to reference the issue number in commits
- [ ] Pushing directly to master instead of creating a PR
- [ ] Creating issues for future iterations instead of the current one
