# Mastra Integration Guide

This project uses [Mastra](https://mastra.ai/) to run AI agents on the server side. The frontend sends messages to a Mastra HTTP endpoint instead of calling an LLM provider directly. This guide explains what Mastra is, how it fits into the project, and how to get it running locally and in production.

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
│   │   ├── reportAgent.ts                # Generates comprehensive research reports
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
┌────────────────┐        HTTP (AI SDK data-stream protocol)        ┌───────────────┐
│   Frontend     │ ──── POST /mastra/api/agents/:agentId/stream ──→ │    Mastra     │
│  (React/Vite)  │ ←──── streaming text chunks (0:"...\n") ──────── │   (Node.js)   │
└────────────────┘                                                  └───────────────┘
```

- **Direct chats** use the user's OpenRouter API key and call the LLM from the browser (phase-1 behavior)
- **Agent chats** (e.g., Deep Research) send messages to the Mastra server, which calls the LLM using the server operator's API keys

The frontend decides which path to take based on the chat's `agentId` field. See `src/config/agents.ts` for the agent registry and `src/messages/hooks/use-chat.ts` for the routing logic.

In development, the Vite dev server proxies `/mastra` requests to `http://localhost:4111` (configured in `vite.config.ts`), so the frontend avoids CORS issues by never calling the Mastra port directly.

## Getting Started (Local Development)

### Step 1 — Install dependencies

From the project root:

```bash
pnpm install
cd mastra && pnpm install && cd ..
```

### Step 2 — Set up environment variables

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

### Step 3 — Start both servers

In one terminal, start the frontend:

```bash
pnpm run dev
```

In another terminal, start Mastra:

```bash
pnpm run dev:mastra
```

Mastra starts on port 4111 and opens the Studio UI at `http://localhost:4111`. The Studio lets you test agents interactively without the frontend.

### Step 4 — Try it out

1. Open the app in your browser
2. Click the **Research** button in the sidebar to create a research chat
3. Ask a question — the agent will search the web and synthesize an answer

No separate OpenRouter API key is needed in the frontend for agent chats. The agent uses the server's key.

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

4. Add a frontend entry in `src/config/agents.ts`:

```typescript
{
  id: "my-agent",
  label: "My Agent",
  type: "mastra",
  description: "A helpful assistant that...",
  mastraAgentId: "myAgent",   // Must match the key in mastra/src/mastra/index.ts
},
```

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

In production the Mastra server runs separately from the static frontend. You have three options, from simplest to most control.

### Option A — Mastra Cloud

Mastra Cloud is a managed hosting service that deploys directly from your GitHub repo.

1. Sign up at [cloud.mastra.ai](https://cloud.mastra.ai)
2. Connect your repo and point it at the `mastra/` directory
3. Set `OPENROUTER_API_KEY` and `EXA_API_KEY` as environment variables in the dashboard
4. Deploy — Mastra Cloud gives you a URL like `https://your-project.mastra.cloud`
5. Set the frontend's `VITE_MASTRA_ENDPOINT` environment variable to that URL (in Netlify or wherever you host the frontend)

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

Note: Netlify Functions have timeout constraints (10s free / 26s paid). Long-running agent tasks may need Mastra's workflow suspend/resume pattern.

### Option C — Standalone Node.js Server

For full control, build a standalone server and deploy it anywhere (Railway, Render, Fly.io, DigitalOcean, etc.).

1. Build: `cd mastra && npx mastra build`
2. The output is a plain Node.js HTTP server
3. Deploy to your host of choice and set the environment variables
4. Point `VITE_MASTRA_ENDPOINT` at your server URL

### Frontend Configuration

Regardless of which option you choose, set this environment variable when building the frontend:

```bash
VITE_MASTRA_ENDPOINT=https://your-mastra-server.example.com
```

Without this variable the frontend defaults to `/mastra`, which only works in local development (where Vite proxies it to port 4111).

## Troubleshooting

**"Could not reach the Mastra server"** — Make sure the Mastra dev server is running (`pnpm run dev:mastra`). Check that port 4111 is not blocked.

**"Network error" on agent chats but direct chats work** — The Vite proxy may not be forwarding correctly. Verify `vite.config.ts` has the `/mastra` proxy entry and that you are accessing the app through the Vite dev server (not a direct file open).

**Agent responds but has no web search results** — Check that `EXA_API_KEY` is set in `mastra/.env`. The Exa tools fail silently if the key is missing.

**"No response body from Mastra server"** — The Mastra server returned an empty response. Check the Mastra terminal for errors. This often means the agent's model provider rejected the request — verify `OPENROUTER_API_KEY` is valid.

**Model errors** — The `MODEL` env var accepts any OpenRouter model ID (e.g., `anthropic/claude-sonnet-4-5`, `google/gemini-2.0-flash-001`). Check [openrouter.ai/models](https://openrouter.ai/models) for available models.
