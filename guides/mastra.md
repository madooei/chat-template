# Mastra Integration Guide

This project uses [Mastra](https://mastra.ai/) to run AI agents on the server side. Research requests flow from the frontend through the Convex backend to a Mastra HTTP server, keeping API keys server-side and unifying auth and persistence. This guide explains what Mastra is, how it fits into the project, and how to get it running locally and in production.

## What Is Mastra

Mastra is a TypeScript framework for building AI agents. You define agents (LLM + instructions + tools + memory) as code and Mastra gives you an HTTP server that exposes streaming endpoints for each agent. It is open-source (Apache 2.0) and runs on Node.js.

Key concepts:

- **Agent** — An LLM with a system prompt, optional tools, and optional memory
- **Tool** — A function the agent can call, defined with Zod schemas for input/output validation
- **Workflow** — A multi-step orchestration with suspend/resume support (for human-in-the-loop flows)
- **Memory** — Conversation history and optional semantic recall, persisted to storage
- **Storage** — A pluggable backend (LibSQL for local dev, Turso/PostgreSQL for production)

Mastra is **not** a hosted platform. It is an npm package you install and run. Mastra Cloud is an optional managed hosting service if you prefer not to manage your own server.

## Project Structure

All Mastra code lives in the root-level `mastra/` directory, separate from the `src/` frontend. The structure follows the [Mastra deep research template](https://github.com/mastra-ai/template-deep-research):

```plaintext
mastra/
├── src/mastra/
│   ├── index.ts                          # Mastra instance — registers agents, workflows, storage
│   ├── agents/
│   │   ├── researchAgent.ts              # Main research agent with web search tools
│   │   ├── evaluationAgent.ts            # Evaluates search result relevance
│   │   ├── learningExtractionAgent.ts    # Extracts key insights from results
│   │   ├── reportAgent.ts               # Generates comprehensive research reports
│   │   └── webSummarizationAgent.ts      # Summarizes web content (uses mini model)
│   ├── tools/
│   │   ├── webSearchTool.ts              # Exa web search + agent-powered summarization
│   │   ├── evaluateResultTool.ts         # Result relevance evaluation via evaluation agent
│   │   └── extractLearningsTool.ts       # Learning & follow-up extraction via extraction agent
│   ├── workflows/
│   │   ├── researchWorkflow.ts           # Interactive research with suspend/resume
│   │   └── generateReportWorkflow.ts     # Full research → approval → report pipeline
│   └── lib/
│       ├── model.ts                      # OpenRouter model helpers (getModel, getMiniModel)
│       └── storage.ts                    # Shared LibSQLStore instance
├── .env.example                          # Required environment variables
├── package.json                          # Mastra-specific dependencies (separate from frontend)
└── tsconfig.json
```

The `src/mastra/` path is required by the Mastra CLI — it looks for the entry file at `src/mastra/src/mastra/index.ts` by default.

The `mastra/` directory has its own `package.json` and `node_modules`. It runs as a separate process from the Vite dev server.

### How the Agents Work Together

The deep research system uses multiple specialized agents orchestrated by tools:

1. **Research Agent** — The main entry point. Uses a two-phase process: initial search, then follow-up research on extracted questions. Calls all three tools.
2. **Web Summarization Agent** — Called by `webSearchTool` to summarize raw web content before passing it to the research agent. Uses a smaller model to reduce cost.
3. **Evaluation Agent** — Called by `evaluateResultTool` to judge whether a search result is relevant to the query.
4. **Learning Extraction Agent** — Called by `extractLearningsTool` to pull key insights and generate follow-up questions from relevant results.
5. **Report Agent** — Used in the `generateReportWorkflow` to synthesize all findings into a structured report.

Tools access other agents via `context.mastra.getAgent("agentName")`, which is why all agents must be registered in `mastra/src/mastra/index.ts`.

## How It Connects to the Frontend

```plaintext
┌────────────────┐   SSE (Convex HTTP action)     ┌───────────────┐   HTTP (Mastra client)   ┌───────────────┐
│   Frontend     │ ── POST /api/chat ───────────→ │    Convex     │ ── agent.stream() ─────→ │    Mastra     │
│  (React/Vite)  │ ←── SSE events ─────────────── │   (Backend)   │ ←── data stream ──────── │   (Node.js)   │
└────────────────┘                                └───────────────┘                          └───────────────┘
```

All AI requests go through a single endpoint: `POST /api/chat`. The LLM decides whether to invoke the `deepResearch` tool based on the user's message:

- **Simple messages** (greetings, factual questions, coding help) — the LLM responds directly via OpenRouter
- **Research-worthy questions** (complex, multi-source topics) — the LLM calls the `deepResearch` tool, which runs the Mastra research-agent and report-agent pipeline server-side

The `deepResearch` tool is defined in `convex/http_chat.ts` alongside the weather tools. Its `execute()` function writes SSE events (research phases, tool calls, text deltas) directly to the Hono stream via closure, so the frontend sees the same research progress UI without any special routing. The frontend always uses a single code path in `src/messages/hooks/use-chat.ts` — it routes incoming tool events to either the research progress UI or the normal tool UI based on the current research phase.

The Mastra server URL is configured as a Convex environment variable (`MASTRA_URL`), not a frontend variable. This keeps the Mastra endpoint invisible to the client.

## Getting Started (Local Development)

> **You must use a local Convex deployment** (not a cloud deployment) when developing with Mastra. The Mastra dev server runs on `localhost:4111`, and Convex actions need to reach it via the `MASTRA_URL` environment variable. With a cloud Convex deployment, actions execute on Convex's remote servers and cannot reach services on your machine — requests to `http://localhost:4111` will fail with "forbidden". With a local deployment (`npx convex dev --local`), the Convex backend runs on your machine and can reach the Mastra server. See the [Convex guide](./convex.md#cloud-vs-local-development) for details on switching between modes.

### Step 1 — Install dependencies

From the project root:

```bash
pnpm install
cd mastra && pnpm install && cd ..
```

### Step 2 — Set up Mastra environment variables

Copy the example file and fill in your keys:

```bash
cp mastra/.env.example mastra/.env
```

Edit `mastra/.env`:

```plaintext
MODEL=openai/gpt-4o              # Default model (any OpenRouter model works)
MODEL_MINI=openai/gpt-4o-mini    # Smaller model for summarization
OPENROUTER_API_KEY=sk-or-...     # Used by all agents via OpenRouter
EXA_API_KEY=...                  # Used by the web search tool
```

- **OpenRouter key** — Get one at [openrouter.ai/keys](https://openrouter.ai/keys)
- **Exa key** — Get one at [dashboard.exa.ai](https://dashboard.exa.ai/api-keys) (free tier available)

### Step 3 — Set the Convex environment variable

Tell Convex where the Mastra server is running:

```bash
npx convex env set MASTRA_URL http://localhost:4111
```

### Step 4 — Start all three servers

```bash
pnpm run dev
```

This uses `concurrently` to start the Convex backend, Vite frontend, and Mastra dev server in one terminal. You can also run them separately:

```bash
pnpm run dev:backend    # Convex dev server
pnpm run dev:frontend   # Vite dev server
pnpm run dev:mastra     # Mastra dev server (port 4111)
```

Mastra starts on port 4111 and opens the Studio UI at `http://localhost:4111`. The Studio lets you test agents interactively without the frontend.

### Step 5 — Try it out

1. Open the app in your browser
2. Create a new chat and ask a complex research question (e.g., "What are the latest developments in quantum computing?")
3. The LLM will automatically invoke the deep research tool, search the web, and synthesize a comprehensive report

No separate API key is needed in the frontend for research. The Mastra server uses the server operator's keys, and communication happens through Convex.

## Adding a New Agent

1. Create a new file in `mastra/src/mastra/agents/` (e.g., `mastra/src/mastra/agents/myAgent.ts`)
2. Define the agent using Mastra's `Agent` class:

```typescript
import { Agent } from "@mastra/core/agent";
import { getModel } from "../lib/model";

export const myAgent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are a helpful assistant that...",
  model: getModel(),
});
```

3. Register it in `mastra/src/mastra/index.ts`:

```typescript
import { myAgent } from "./agents/myAgent";

export const mastra = new Mastra({
  agents: {
    researchAgent,
    myAgent, // Add here
    // ...
  },
  // ...
});
```

4. To expose the agent to the chat, add a new tool in `convex/http_chat.ts` (following the `deepResearch` tool pattern) that calls the agent via `MastraClient`.

Restart the Mastra dev server and the new agent appears in the UI.

## Adding a New Tool

Tools are functions that agents can call. They are defined with Zod schemas and can access other agents via the execution context.

1. Create a new file in `mastra/src/mastra/tools/` (e.g., `mastra/src/mastra/tools/myTool.ts`):

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const myTool = createTool({
  id: "my-tool",
  description: "Does something useful",
  inputSchema: z.object({
    query: z.string().describe("The input query"),
  }),
  execute: async (input, context) => {
    // input is the validated Zod object
    // context.mastra.getAgent("agentName") accesses other agents
    return { result: `Processed: ${input.query}` };
  },
});
```

2. Add it to an agent's `tools` object in its agent file.

## Deploying to Production

In production the Mastra server runs separately from the static frontend and the Convex backend. The Convex backend connects to the Mastra server using the `MASTRA_URL` environment variable. You have three options for hosting Mastra, from simplest to most control.

### Option A — Mastra Cloud

Mastra Cloud is a managed hosting service that deploys directly from your GitHub repo.

1. Sign up at [cloud.mastra.ai](https://cloud.mastra.ai)
2. Connect your repo and point it at the `mastra/` directory
3. Set `OPENROUTER_API_KEY` and `EXA_API_KEY` as environment variables in the dashboard
4. Deploy — Mastra Cloud gives you a URL like `https://your-project.mastra.cloud`
5. Set `MASTRA_URL` on your **Convex production deployment** to that URL (see the [Convex guide](./convex.md#going-to-production))

### Option B — Netlify Functions

If you already host the frontend on Netlify, you can colocate the Mastra backend as serverless functions.

1. Add the Netlify deployer: `cd mastra && pnpm add @mastra/deployer-netlify`
2. Update `mastra/src/mastra/index.ts` to use the deployer (see [Mastra docs](https://mastra.ai/docs/deployment/netlify))
3. Swap storage from local LibSQL (`file:`) to a remote provider like [Turso](https://turso.tech/) (free tier available):
   ```bash
   cd mastra && pnpm add @libsql/client
   ```
   Update `mastra/src/mastra/lib/storage.ts` with your Turso database URL and auth token
4. Build: `cd mastra && npx mastra build`
5. Deploy the output alongside your frontend
6. Set `MASTRA_URL` on your Convex production deployment to the Netlify function URL

Note: Netlify Functions have timeout constraints (10s free / 26s paid). Long-running agent tasks may need Mastra's workflow suspend/resume pattern.

### Option C — Standalone Node.js Server

For full control, build a standalone server and deploy it anywhere (Railway, Render, Fly.io, DigitalOcean, etc.).

1. Build: `cd mastra && npx mastra build`
2. The output is a plain Node.js HTTP server
3. Deploy to your host of choice and set the environment variables
4. Set `MASTRA_URL` on your Convex production deployment to your server URL

### Convex Configuration

Regardless of which hosting option you choose, set the `MASTRA_URL` environment variable on your Convex deployment:

```bash
npx convex env set MASTRA_URL https://your-mastra-server.example.com
```

For local development, this is `http://localhost:4111`. For production, point it at your deployed Mastra server.

## Troubleshooting

**"Could not reach the Mastra server"** — Make sure the Mastra dev server is running (`pnpm run dev:mastra`). Check that port 4111 is not blocked. Verify the Convex `MASTRA_URL` environment variable is set correctly (`npx convex env get MASTRA_URL`).

**"Research streaming failed: forbidden"** — This means Convex actions cannot reach the Mastra server. The most common cause is using a cloud Convex deployment instead of a local one. Cloud actions run on Convex's remote servers and cannot access `localhost` on your machine. Switch to a local deployment: delete `.env.local` and run `npx convex dev --local` (see [Getting Started](#getting-started-local-development) above).

**"MASTRA_URL not configured"** — The Convex backend cannot find the Mastra server URL. Run `npx convex env set MASTRA_URL http://localhost:4111` to set it.

**Agent responds but has no web search results** — Check that `EXA_API_KEY` is set in `mastra/.env`. The Exa tools fail silently if the key is missing.

**"No response body from Mastra server"** — The Mastra server returned an empty response. Check the Mastra terminal for errors. This often means the agent's model provider rejected the request — verify `OPENROUTER_API_KEY` is valid.

**Model errors** — The `MODEL` env var accepts any OpenRouter model ID (e.g., `anthropic/claude-sonnet-4-5`, `google/gemini-2.0-flash-001`). Check [openrouter.ai/models](https://openrouter.ai/models) for available models.
