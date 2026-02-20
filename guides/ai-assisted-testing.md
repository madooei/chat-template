# AI-Assisted Testing Guide

This guide walks you through using Claude Code to write and maintain tests. It complements the [Testing](testing.md) guide, which explains how the test infrastructure works. This one covers the AI-assisted workflow for creating tests.

## Prerequisites

- Claude Code installed and working
- The dev server runs: `pnpm run dev`
- Playwright browsers installed: `npx playwright install chromium`
- You've read [Testing](testing.md) to understand the test layers

## Two Kinds of AI-Assisted Testing

**Unit and integration tests** — Ask Claude directly. It uses the `frontend-testing` skill to generate Vitest tests that follow the project's patterns.

**E2E tests** — Use the Playwright agent pipeline. Three specialist agents plan, generate, and fix browser tests by actually running the app.

## Writing Unit and Integration Tests

For stores, hooks, and components, just ask Claude:

```plaintext
> Write tests for the bookmarks store
```

Claude loads the `frontend-testing` skill, reads the store implementation, and generates a test file at `src/bookmarks/store/__tests__/bookmark.test.ts` following the project's patterns — store reset in `beforeEach`, test helpers for data, observable behavior assertions.

The same works for hooks and components:

```plaintext
> Write tests for the useQueryBookmarks hook
> Write tests for the BookmarkButton component
```

Claude picks the right test pattern (store test, `renderHook`, or `render` + `userEvent`) based on what you're testing.

## The Playwright Agent Pipeline

E2E tests use three specialist agents that talk to a real browser through an MCP server. Each agent has a specific job:

| Agent         | What it does                                                                          | Invoke with                 |
| ------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| **Planner**   | Opens the app, explores it, writes a structured test plan                             | `/playwright-test-plan`     |
| **Generator** | Takes a test case from the plan, executes it in a browser, writes the `.spec.ts` file | `/playwright-test-generate` |
| **Healer**    | Runs failing tests, debugs them, fixes the code                                       | `/playwright-test-heal`     |

There's also `/playwright-test-coverage` which runs all three in sequence.

### Step 1: Plan

```plaintext
> /playwright-test-plan
> Plan tests for the chat management feature
```

The planner agent:

1. Reads the seed file (`e2e/seed.spec.ts`) to understand the app's starting state
2. Opens the app in a real browser and explores the UI
3. Maps out user flows and edge cases
4. Saves a structured test plan to `specs/` (e.g., `specs/chat.plan.md`)

Review the plan before generating tests. Remove scenarios you don't need, add ones the agent missed, and adjust expected behaviors.

### Step 2: Generate

```plaintext
> /playwright-test-generate
> Generate tests for item 1.1 from specs/chat.plan.md
```

The generator agent:

1. Reads the test case from the plan
2. Opens the app and manually executes each step in a real browser
3. Records what it did (clicks, types, assertions)
4. Writes the test to a `.spec.ts` file

Each test case becomes one file. The agent executes the steps in a real browser first, so the generated test matches actual app behavior — not just what the plan says should happen.

### Step 3: Heal

```plaintext
> /playwright-test-heal
```

The healer agent:

1. Runs all E2E tests with `test_run`
2. For each failure, runs `test_debug` to pause at the error
3. Inspects the page (snapshots, console, network) to diagnose the issue
4. Edits the test code to fix it
5. Reruns until all tests pass

If a test can't be fixed (the app genuinely doesn't match the expectation), the healer marks it `test.fixme()` with a comment explaining the mismatch.

### The Full Pipeline

For a new feature with no existing E2E tests:

```plaintext
> /playwright-test-coverage
> Cover the settings feature
```

This orchestrates all three agents in sequence: plan the tests, generate each one, then heal any failures. It's the hands-off option.

## Hand-Written vs Agent-Generated Tests

The project has both:

- **Hand-written**: `e2e/chat-flow.spec.ts`, `e2e/message-flow.spec.ts`, `e2e/settings-flow.spec.ts` — maintained manually
- **Agent-generated**: Files under `e2e/<feature>/` — created by the generator, healed by the healer

Both run together with `pnpm run test:e2e`. The agents don't touch hand-written tests.

## When to Use What

| Situation                           | Approach                                              |
| ----------------------------------- | ----------------------------------------------------- |
| New store or hook                   | Ask Claude directly for unit tests                    |
| New component                       | Ask Claude for component tests with RTL               |
| New feature needs E2E coverage      | `/playwright-test-coverage` for the full pipeline     |
| Specific user journey to test       | `/playwright-test-plan` + `/playwright-test-generate` |
| E2E tests broke after a code change | `/playwright-test-heal`                               |
| Quick smoke test for a small change | Write a focused test manually or ask Claude           |

## Tips

**Review generated test plans.** The planner explores the app thoroughly, but it doesn't know your requirements. Cut scenarios that test the obvious, add ones that test your edge cases.

**Generate one test at a time.** The generator works best with a single focused test case. The full pipeline handles sequencing, but if you're running it manually, go one by one.

**Run tests locally before pushing.** `pnpm run test:e2e` runs all E2E tests headless. Use `pnpm run test:e2e:ui` to watch them run in a browser if something looks wrong.

**The healer is not magic.** It fixes selector changes, timing issues, and assertion mismatches. It won't fix tests that are fundamentally testing the wrong thing. If the healer marks a test `test.fixme()`, read the comment — it might reveal a real bug.
