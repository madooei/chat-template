# Phase 3 — Agentic AI with Mastra

Working notes, decisions, and research findings for phase-3 integration.

---

## Decisions

1. **Use Mastra as the agentic AI framework** — TypeScript framework, open-source, not a locked-in platform
2. **Mastra code lives at root-level `mastra/` directory** — Consistent with `convex/` at root in phase-2. Not inside `src/` since Mastra is server-side and `src/` is the Vite/React frontend
3. **Deployment fallback chain: Mastra Cloud → Netlify Functions → VPS** — Each tier uses official supported methods. Mastra code doesn't change between tiers. Each step down adds complexity only when the simpler option fails
4. **Frontend calls Mastra endpoint via `useChat()` from `@ai-sdk/react`** — Already using Vercel AI SDK. Mastra exposes AI SDK-compatible streaming endpoints
5. **Phase-2 and phase-3 built concurrently from phase-1 base** — Using git worktrees. This worktree is `phase-3`, original repo is `phase-2`
6. **Deep Research Agent as the flagship feature** — First Mastra agent to build
7. **Selectable agent pattern (not agent-as-tool)** — UI lets the user pick which agent to chat with. Normal chat goes directly to LLM (phase-1 behavior). When user selects "Deep Research", `useChat()` points to the Mastra endpoint instead. Rejected the agent-as-tool pattern because client-side orchestration of long-running workflows is fragile (browser closes = workflow lost, awkward UX for multi-minute tasks). The Mastra agent owns its tools server-side.

8. **Custom `streamMastraChat()` over `@ai-sdk/react` useChat** — Instead of swapping the entire chat hook to `@ai-sdk/react`, we kept the existing custom `useChat` hook and added a `streamMastraChat()` function that speaks the AI SDK data-stream protocol. This avoids introducing a second state management approach and keeps both direct and Mastra chats using the same UI pipeline (onChunk/onFinish/onError callbacks).
9. **Agent selected at chat creation time** — Each chat stores an optional `agentId`. The sidebar shows two buttons: "New Chat" (direct) and "Research" (deep-research agent). The add-chat dialog also has an agent type picker. Once created, the agent type is fixed for that chat.
10. **Vite proxy for CORS in dev** — Vite proxies `/mastra` to `http://localhost:4111` to avoid CORS issues during development. The `streamMastraChat()` function hits Mastra's `/api/agents/:agentId/stream` endpoint directly in production.
11. **Title generation fallback for Mastra chats** — If no OpenRouter key is configured, Mastra chat titles fall back to the first few words of the user's message.

## Open Questions (Resolved)

- ~~Which external storage provider for serverless deployments?~~ — Deferred to deployment phase. Using local `LibSQLStore` with `file:` for dev.
- ~~How does the frontend handle the "bring your own API key" model when Mastra is server-side?~~ — Direct chats use the user's OpenRouter key (client-side). Mastra chats use the server operator's API keys (env vars). This split is intentional for a teaching context.
- ~~What does the agent selector UI look like?~~ — Two buttons in the sidebar header ("New Chat" + "Research"), plus an agent type picker in the add-chat dialog. Agent badge shown in the messages page header.

## Open Questions (Remaining)

- Which external storage provider for serverless deployments? (Turso free tier vs Upstash free tier) — Still relevant for production deployment.
- How to handle Mastra server auth in production? (API key header? Session tokens?)

---

## What Is Mastra

Mastra is a **TypeScript framework** for building AI agents and applications. Created by the team behind Gatsby, backed by Y Combinator. Apache 2.0 open-source.

**Core primitives:**

- **Agents** — LLM-backed entities with identity, instructions, model, optional tools and memory
- **Tools** — Functions agents can invoke, defined with Zod schemas for input/output validation
- **Workflows** — Graph-based orchestration with suspend/resume (human-in-the-loop)
- **Memory** — Three tiers: message history (sliding window), working memory (persistent scratchpad), semantic recall (vector-based RAG on conversation history)
- **Model routing** — Unified string format (`"openai/gpt-4o"`) across 40+ LLM providers

**Not a platform.** Mastra is a framework you install as npm packages. Mastra Cloud is an optional managed hosting service (separate concern).

## Integration Modes

Mastra can be used three ways:

1. **Standalone server** — `mastra dev` runs an HTTP server on port 4111 with Studio UI for testing
2. **Embedded in your server** — Server adapters (`@mastra/express`, `@mastra/hono`, `@mastra/fastify`) mount Mastra routes into an existing backend
3. **Direct library** — Import `Agent` from `@mastra/core/agent`, call `agent.generate()` in any Node.js code

## Project Structure

```plaintext
chat-template-phase-3/
├── mastra/              # Mastra agents, tools, workflows (server-side)
│   ├── index.ts         # Mastra instance config
│   ├── agents/          # Agent definitions
│   ├── tools/           # Tool definitions
│   └── workflows/       # Workflow definitions
├── src/                 # React/Vite frontend (client-side)
│   ├── chats/
│   ├── messages/
│   ├── settings/
│   └── ...
├── e2e/                 # Playwright tests
├── docs/                # Documentation
└── ...
```

## Deployment Fallback Chain

### Tier 1: Mastra Cloud (simplest)

- Zero-config deployment from GitHub
- Free during public beta (pricing TBD Q1 2026)
- Includes Studio UI, monitoring, observability
- Risk: beta stability, future pricing

### Tier 2: Netlify Functions (single platform)

- Already using Netlify for frontend hosting
- `@mastra/deployer-netlify` is first-class
- Frontend (static) + backend (functions) on same domain, no CORS
- Must use external storage (no `LibSQLStore` with `file:` URLs in serverless)
- Timeout constraints: 10s free / 26s paid (synchronous), background functions up to 15 min on paid
- Mastra's workflow suspend/resume handles the timeout constraint by breaking work into steps

### Tier 3: Standalone Node.js on VPS (full control)

- `mastra build` produces a plain Node.js HTTP server
- Deploy to Railway, Render, Fly.io, DigitalOcean, etc.
- No timeout constraints, can use local `LibSQLStore`
- Most operational overhead

### Migration between tiers

The `mastra/` directory (agents, tools, workflows) stays the same. Only deployment config changes:

- **Cloud → Netlify** — Add `NetlifyDeployer` to Mastra config, swap storage to Turso/Upstash, run `mastra build`
- **Netlify → VPS** — Remove deployer, `mastra build` produces Node.js server, deploy anywhere

## Key Constraints

- **Node.js 22.13.0+** required by Mastra
- **Serverless = no local filesystem storage.** Must use Turso (remote LibSQL), PostgreSQL (`@mastra/pg`), or Upstash Redis (`@mastra/upstash`)
- **Convex runtime is not suitable for Mastra.** Convex's edge-like runtime lacks full Node.js support, has no telemetry, and opting into Node env is slow. Mastra needs its own server-side process.

## Key Packages

- `@mastra/core` — Core framework (agents, workflows, tools, memory)
- `mastra` (dev dep) — CLI tool (`mastra dev`, `mastra build`, `mastra init`)
- `@mastra/memory` — Memory system (message history, working memory, semantic recall)
- `@mastra/libsql` — LibSQL storage + vector backends (local dev)
- `@mastra/deployer-netlify` — Netlify Functions deployer (tier 2)
- `@mastra/ai-sdk` — Bridge between Mastra agents and Vercel AI SDK streaming format
- `@ai-sdk/react` — React hooks (`useChat`) — already in the project
- `zod` — Schema validation for tools and structured working memory — already in the project

## Frontend ↔ Mastra Communication

The frontend talks to Mastra over HTTP. The `@ai-sdk/react` `useChat()` hook handles streaming:

```typescript
import { useChat } from "@ai-sdk/react";

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "https://your-mastra-endpoint/chat/my-agent",
  });
  // ... render chat UI
}
```

Mastra exposes `/chat/:agentId` endpoints that stream responses in AI SDK-compatible format.

## Agent Definition Pattern

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const myAgent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "System prompt here...",
  model: "openai/gpt-4o",
  tools: {
    /* tool instances */
  },
  memory: new Memory({
    options: {
      lastMessages: 15,
      semanticRecall: false,
      workingMemory: { enabled: true, scope: "resource", template: "..." },
    },
  }),
});
```

## Workflow Suspend/Resume (Deep Research Pattern)

Mastra workflows can suspend at any step, persist state as a snapshot to storage, and resume later. This is critical for:

- Serverless timeouts (break work into steps that fit within function limits)
- Human-in-the-loop (pause for user approval, resume when ready)
- Long-running research (search → evaluate → approve → report)

For production serverless, Mastra recommends **Inngest** as a workflow runner (step memoization, automatic retries, monitoring).

## Reference: Deep Research Template

Mastra's [deep research template](https://github.com/mastra-ai/template-deep-research) demonstrates:

- Workflow orchestration with multiple steps
- Web search via Exa API
- Result evaluation and learning extraction
- Suspend for human approval (human-in-the-loop)
- Comprehensive markdown report generation

## Reference: Previous Project (Flashcards App)

`/Users/alimadooei/Desktop/CS264/01-SP-25/proj-flashcards-app` used:

- **Convex** as primary backend with Hono-based HTTP endpoints for AI completions (streaming via SSE)
- **Serverless Framework + AWS Lambda** as a separate Python/Flask API (manual `serverless deploy`, not in CI/CD)

The Serverless Framework approach was rejected for phase-3 because: no official Mastra AWS Lambda deployer, manual deployment, another platform (AWS) for students to manage, and if you need that level of control a VPS is simpler.

## Reference: Local Tutorial

Tutorial materials at `/Users/alimadooei/Desktop/gen-ai/content/07-mastra/` cover:

- `note-00.md` — Mastra overview and setup
- `note-01.md` — Agents and tools
- `note-02.md` — Memory (message history, working memory, semantic recall)
- `lab/` — Working code examples of basic, history, working memory, and semantic agents
