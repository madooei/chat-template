# Mastra — Deep Research Agent

Server-side AI agents for the chat template. Based on the [Mastra deep research template](https://github.com/mastra-ai/template-deep-research).

## Quick Start

```bash
pnpm install
cp .env.example .env   # Fill in your keys
pnpm run dev           # Starts on http://localhost:4111
```

## Environment Variables

| Variable             | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `OPENROUTER_API_KEY` | OpenRouter API key (used by all agents)                               |
| `EXA_API_KEY`        | Exa API key (used by the web search tool)                             |
| `MODEL`              | Default model ID, e.g. `openai/gpt-4o` (optional)                     |
| `MODEL_MINI`         | Smaller model for summarization, e.g. `openai/gpt-4o-mini` (optional) |

## Architecture

Five specialized agents collaborate through three tools and two workflows:

```plaintext
┌──────────────────────────────────────────────────────────────┐
│                    Research Agent                            │
│  (main entry point — breaks query into searches)             │
│                                                              │
│  Tools:                                                      │
│    webSearchTool ──→ Web Summarization Agent (mini model)    │
│    evaluateResultTool ──→ Evaluation Agent                   │
│    extractLearningsTool ──→ Learning Extraction Agent        │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              generateReportWorkflow                         │
│  research (suspend/resume) → approval → Report Agent        │
└─────────────────────────────────────────────────────────────┘
```

### Agents

| Agent                     | File                                | Role                                                      |
| ------------------------- | ----------------------------------- | --------------------------------------------------------- |
| Research Agent            | `agents/researchAgent.ts`           | Orchestrates two-phase web research using all three tools |
| Evaluation Agent          | `agents/evaluationAgent.ts`         | Judges whether a search result is relevant to the query   |
| Learning Extraction Agent | `agents/learningExtractionAgent.ts` | Extracts key insights and follow-up questions             |
| Web Summarization Agent   | `agents/webSummarizationAgent.ts`   | Condenses raw web content (uses a smaller model)          |
| Report Agent              | `agents/reportAgent.ts`             | Synthesizes findings into a structured report             |

### Tools

| Tool                   | File                            | Description                                         |
| ---------------------- | ------------------------------- | --------------------------------------------------- |
| `webSearchTool`        | `tools/webSearchTool.ts`        | Searches the web via Exa, then summarizes results   |
| `evaluateResultTool`   | `tools/evaluateResultTool.ts`   | Evaluates result relevance via the evaluation agent |
| `extractLearningsTool` | `tools/extractLearningsTool.ts` | Extracts learnings via the extraction agent         |

### Workflows

| Workflow                 | File                                  | Description                                                          |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------------- |
| `researchWorkflow`       | `workflows/researchWorkflow.ts`       | Interactive research with suspend/resume for user input and approval |
| `generateReportWorkflow` | `workflows/generateReportWorkflow.ts` | Loops research until approved, then generates a report               |

## Project Structure

```plaintext
mastra/
└── src/mastra/
    ├── index.ts                          # Mastra instance config
    ├── agents/
    │   ├── researchAgent.ts
    │   ├── evaluationAgent.ts
    │   ├── learningExtractionAgent.ts
    │   ├── reportAgent.ts
    │   └── webSummarizationAgent.ts
    ├── tools/
    │   ├── webSearchTool.ts
    │   ├── evaluateResultTool.ts
    │   └── extractLearningsTool.ts
    ├── workflows/
    │   ├── researchWorkflow.ts
    │   └── generateReportWorkflow.ts
    └── lib/
        ├── model.ts                      # OpenRouter model helpers
        └── storage.ts                    # LibSQLStore config
```

## API Endpoints

When running (`pnpm run dev`), Mastra exposes:

- `POST /api/agents/researchAgent/stream` — Stream a research conversation
- `GET /api/agents` — List all registered agents
- Mastra Studio UI at `http://localhost:4111` — Interactive testing dashboard

## Models

All agents use [OpenRouter](https://openrouter.ai/) as the model provider. The default model is `openai/gpt-4o`. The summarization agent uses `openai/gpt-4o-mini` to reduce cost. Override via `MODEL` and `MODEL_MINI` env vars. Any model available on OpenRouter works.

## Related

- [Mastra docs](https://mastra.ai/docs)
- [Mastra deep research template](https://github.com/mastra-ai/template-deep-research)
- [OpenRouter models](https://openrouter.ai/models)
- [Exa API](https://docs.exa.ai/)
- [`guides/mastra.md`](../guides/mastra.md) — Full integration guide covering frontend connection, deployment, and adding new agents
