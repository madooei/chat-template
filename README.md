# Chat Template

A "bring your own API key" AI chat application built with React, Vite, and nanostores. Users pick a provider, supply their own key, and chat — all running locally with no backend.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to Settings, enter your API key, and start chatting.

## Project Structure

```plaintext
src/
├── app/            # Router configuration
├── chats/          # Chat feature (types, store, hooks, components, pages)
├── messages/       # Messages feature (same structure)
├── settings/       # Settings feature (same structure)
├── components/     # Shared UI (shadcn, prompt-kit)
├── layout/         # App shell (header, sidebar)
├── lib/            # Utilities (AI provider wrapper)
├── test/           # Test setup and helpers
└── styles/         # Global CSS

e2e/                # Playwright end-to-end tests
specs/              # Feature specifications
```

Each feature follows the pipeline: `types/ → store/ → hooks/ → components/ → pages/`. Each layer only talks to the one below it.

## Scripts

| Command               | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Start dev server                                   |
| `npm run build`       | Type-check and build for production                |
| `npm run test`        | Run unit/integration tests (Vitest)                |
| `npm run test:watch`  | Run tests in watch mode                            |
| `npm run test:e2e`    | Run E2E tests (Playwright, auto-starts dev server) |
| `npm run test:e2e:ui` | Open Playwright's interactive test runner          |
| `npm run validate`    | Type-check + lint + test — the quality gate        |
| `npm run lint`        | Run ESLint                                         |
| `npm run format`      | Run Prettier                                       |

## Testing

**Unit and integration tests** use Vitest + React Testing Library. Tests live in `__tests__/` folders next to the code they test. A setup file (`src/test/setup.ts`) handles jsdom environment patching — localStorage mock for nanostores, `ResizeObserver` stub, deterministic UUIDs — and cleans up after each test. Helper factories in `src/test/helpers.ts` create test data with sensible defaults.

**E2E tests** use Playwright with Chromium. Tests live in `e2e/` and interact through accessibility roles, not CSS selectors. Playwright auto-starts the dev server — just run `npm run test:e2e`. Each test clears localStorage and reloads to start from a clean slate.

**AI-assisted testing** — three Claude Code agents (`.claude/agents/`) use Playwright's MCP server to plan, generate, and heal E2E tests from plain English descriptions.

## Tech Stack

React, TypeScript, Vite, nanostores, Tailwind CSS, shadcn/ui, prompt-kit, Vercel AI SDK, Vitest, Playwright.

## AI-Assisted Development

This template is designed to be built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Skills in `.claude/skills/` encode the project's conventions so the AI generates consistent code.
