# Chat Template

An AI chat application built with React, Vite, Convex, Hono, and Mastra. Users sign in with email/password or continue as a guest, then chat — no API key required. The Convex backend handles auth, data persistence, and SSE streaming of AI responses via OpenRouter. A Mastra agent server provides deep research capabilities: multi-step web search, evaluation, and report generation.

## Prerequisites

- [Git](https://git-scm.com/downloads)
- [GitHub CLI (`gh`)](https://cli.github.com/) — used for issue, label, milestone, and PR management
- [Node.js 18+](https://nodejs.org/en/download/) — includes npm
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`

## Architecture

The app runs as three services:

1. **Frontend** (React/Vite) — the SPA that runs in the browser
2. **Convex** — the backend (database, auth, server functions, SSE streaming)
3. **Mastra** — the AI agent server (deep research workflows)

```plaintext
Browser ──WebSocket──▶ Convex (database, auth, queries/mutations)
                         │
                         ├──SSE──▶ OpenRouter (normal chat streaming)
                         │
                         └──HTTP──▶ Mastra (deep research agents)
                                      │
                                      ├──▶ OpenRouter (LLM calls)
                                      └──▶ Exa (web search)
```

## Getting Started

```bash
pnpm install
pnpm run dev
```

This starts both the Convex backend and the Vite frontend. Open [http://localhost:5173](http://localhost:5173) and start chatting — sign-in is automatic, no API key required.

To also run deep research locally, start the Mastra dev server in a separate terminal:

```bash
pnpm run dev:mastra
```

See the [Convex guide](guides/convex.md) and [Mastra guide](guides/mastra.md) for detailed setup instructions.

## Project Structure

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

Each feature follows the pipeline: `types/ → store/ → hooks/ → components/ → pages/`. Each layer only talks to the one below it.

## Scripts

| Command                 | What it does                                       |
| ----------------------- | -------------------------------------------------- |
| `pnpm run dev`          | Start Convex backend + Vite frontend concurrently  |
| `pnpm run dev:frontend` | Start Vite dev server only                         |
| `pnpm run dev:backend`  | Start Convex dev server only                       |
| `pnpm run dev:mastra`   | Start Mastra agent server locally                  |
| `pnpm run build`        | Type-check and build for production                |
| `pnpm run test`         | Run unit/integration tests (Vitest)                |
| `pnpm run test:watch`   | Run tests in watch mode                            |
| `pnpm run test:e2e`     | Run E2E tests (Playwright, auto-starts dev server) |
| `pnpm run test:e2e:ui`  | Open Playwright's interactive test runner          |
| `pnpm run validate`     | Type-check + lint + test — the quality gate        |
| `pnpm run lint`         | Run ESLint                                         |
| `pnpm run format`       | Run Prettier                                       |

## Testing

**Frontend tests** use Vitest + React Testing Library. Tests live in `__tests__/` folders next to the code they test. A setup file (`src/test/setup.ts`) handles jsdom environment patching — localStorage stub, `ResizeObserver` stub, deterministic UUIDs — and clears localStorage after each test. Helper factories in `src/test/helpers.ts` create test data with sensible defaults. Frontend hooks mock `convex/react` (`useQuery`, `useMutation`) with `vi.mock`.

**Backend tests** use `convex-test` with the `edge-runtime` environment. Tests live alongside Convex functions in `convex/` (e.g., `chats.test.ts`, `messages.test.ts`). Run backend tests only with `pnpm run test:convex`.

**E2E tests** use Playwright with Chromium. Tests live in `e2e/` and interact through accessibility roles, not CSS selectors. Playwright auto-starts the dev server — just run `pnpm run test:e2e`. Each test clears localStorage and reloads to start from a clean slate.

**AI-assisted testing** — Claude Code agents (`.claude/agents/`) use Playwright's MCP server to plan, generate, and heal E2E tests from plain English descriptions. Additional agents handle code review and user manual generation.

## Tech Stack

React, TypeScript, Vite, Convex, Hono, @convex-dev/auth, Mastra, Legend-State, Wouter, Tailwind CSS, shadcn/ui, prompt-kit, Vercel AI SDK, @openrouter/ai-sdk-provider, Vitest, Playwright.

## Documentation

| Folder                 | Audience   | What it contains                                            |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| [`guides/`](guides/)   | Developers | How-to guides for Convex, Mastra, testing, deployment, etc. |
| [`docs/`](docs/)       | Team       | Product requirements, tech decisions, iteration plans       |
| [`manuals/`](manuals/) | End users  | Step-by-step walkthroughs with screenshots                  |

## AI-Assisted Development

This template is designed to be built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Skills in `.claude/skills/` encode the project's conventions so the AI generates consistent code.
