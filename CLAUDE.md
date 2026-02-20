# Project Configuration

**Important:**  Run `pnpm validate` after you make any changes to the code. It runs the type-check, lint, and test commands.

## Project Description

A "bring your own API key" AI chat application. Users pick a provider, supply their own key, and chat — all running locally with no backend. Phase 1 of a multi-phase template.

## Tech Stack

React 19, TypeScript, Vite, Legend-State, Wouter, Tailwind CSS v4, shadcn/ui, prompt-kit, Vercel AI SDK, Vitest, Playwright

## Commands

- Install dependencies: `pnpm install`
- Run development server: `pnpm run dev`
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
src/
├── store/          # Shared state utilities (persisted observable)
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
guides/             # How-to guides for students
docs/               # Iteration plans, PRD, team agreement
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
