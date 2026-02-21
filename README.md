# Chat Template

A "bring your own API key" AI chat application built with React, Vite, Legend-State, and Wouter. Users pick a provider, supply their own key, and chat — all running locally with no backend.

## Prerequisites

- [Git](https://git-scm.com/downloads)
- [GitHub CLI (`gh`)](https://cli.github.com/) — used for issue, label, milestone, and PR management
- [Node.js 18+](https://nodejs.org/en/download/) — includes npm
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to Settings, enter your API key, and start chatting.

## Project Structure

```plaintext
src/
├── store/          # Shared state utilities (persisted observable)
├── chats/          # Chat feature (types, store, hooks, components, pages)
├── messages/       # Messages feature (same structure)
├── settings/       # Settings feature (same structure)
├── components/     # Shared UI (shadcn, prompt-kit)
├── config/         # App configuration constants
├── hooks/          # Shared React hooks
├── layout/         # App shell (header, sidebar)
├── lib/            # Utilities (AI provider wrapper)
├── test/           # Test setup and helpers
├── types/          # Shared TypeScript types and Zod schemas
└── styles/         # Global CSS

e2e/                # Playwright end-to-end tests
playwright-specs/   # Playwright E2E test plans
guides/             # How-to guides for students
docs/               # Iteration plans, PRD, team agreement
manuals/            # End-user manuals with screenshots
```

Each feature follows the pipeline: `types/ → store/ → hooks/ → components/ → pages/`. Each layer only talks to the one below it.

## Scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `pnpm run dev`         | Start dev server                                   |
| `pnpm run build`       | Type-check and build for production                |
| `pnpm run test`        | Run unit/integration tests (Vitest)                |
| `pnpm run test:watch`  | Run tests in watch mode                            |
| `pnpm run test:e2e`    | Run E2E tests (Playwright, auto-starts dev server) |
| `pnpm run test:e2e:ui` | Open Playwright's interactive test runner          |
| `pnpm run validate`    | Type-check + lint + test — the quality gate        |
| `pnpm run lint`        | Run ESLint                                         |
| `pnpm run format`      | Run Prettier                                       |

## Testing

**Unit and integration tests** use Vitest + React Testing Library. Tests live in `__tests__/` folders next to the code they test. A setup file (`src/test/setup.ts`) handles jsdom environment patching — localStorage stub, `ResizeObserver` stub, deterministic UUIDs — and clears localStorage after each test. Helper factories in `src/test/helpers.ts` create test data with sensible defaults.

**E2E tests** use Playwright with Chromium. Tests live in `e2e/` and interact through accessibility roles, not CSS selectors. Playwright auto-starts the dev server — just run `pnpm run test:e2e`. Each test clears localStorage and reloads to start from a clean slate.

**AI-assisted testing** — Claude Code agents (`.claude/agents/`) use Playwright's MCP server to plan, generate, and heal E2E tests from plain English descriptions. Additional agents handle code review and user manual generation.

## Tech Stack

React, TypeScript, Vite, Legend-State, Wouter, Tailwind CSS, shadcn/ui, prompt-kit, Vercel AI SDK, Vitest, Playwright.

## AI-Assisted Development

This template is designed to be built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Skills in `.claude/skills/` encode the project's conventions so the AI generates consistent code.
