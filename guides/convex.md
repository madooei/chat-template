# Convex Guide

Convex is the backend for this project. It replaces what was previously a frontend-only data layer (Legend-State + IndexedDB) with a real server: a reactive database, server-side functions, authentication, and HTTP endpoints — all managed as code in the `convex/` directory.

## What Convex Does

Think of Convex as a backend-as-a-service that speaks WebSocket. Instead of REST endpoints that you poll, Convex **pushes** data to the client in real time. When a chat message is saved to the database, every connected client viewing that chat sees it instantly — no refetching.

The key pieces:

- **Schema** (`convex/schema.ts`) — defines tables and indexes, like a database migration
- **Queries** (`*_queries.ts`) — read-only functions that subscribe to data changes
- **Mutations** (`*_mutations.ts`) — write functions that modify the database
- **Actions** (`*_actions.ts`) — side-effect functions that can call external APIs
- **HTTP actions** (`convex/http.ts`) — traditional HTTP endpoints (we use these for SSE streaming)
- **Auth** (`convex/auth.ts`) — anonymous authentication via `@convex-dev/auth`

All of these are TypeScript files in `convex/`. When you run `npx convex dev`, Convex watches this directory and hot-deploys changes to the cloud.

## First-Time Dev Setup

### 1. Install Dependencies

```bash
pnpm install
```

This installs both frontend and Convex dependencies (they share a single `package.json`).

### 2. Start Convex Dev Server

```bash
npx convex dev
```

The first time you run this, Convex walks you through:

1. **Log in** — opens a browser tab to authenticate with your Convex account (create one at [convex.dev](https://www.convex.dev/) if you don't have one)
2. **Create a project** — pick a name (the repo name works fine)
3. **Generate `.env.local`** — Convex writes `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to `.env.local`

After setup, the dev server watches `convex/` for changes and deploys them automatically. It also generates the `convex/_generated/` directory containing typed API references.

### 3. Generate Auth Keys

`@convex-dev/auth` needs a JWT key pair to sign session tokens. Generate them by running the following command in another terminal:

```bash
npx @convex-dev/auth
```

This generates `JWT_PRIVATE_KEY` and `JWKS` and automatically stores them on your Convex server.

### 4. Set Environment Variables on the Convex Dashboard

In addition to the `JWT_PRIVATE_KEY` and `JWKS`, you also need to set the `OPENROUTER_API_KEY` and `SITE_URL` environment variables.

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev/)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these:

| Variable             | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| `JWT_PRIVATE_KEY`    | The private key from Step 3                              |
| `JWKS`               | The public key JSON from Step 3                          |
| `OPENROUTER_API_KEY` | Your OpenRouter API key (for server-side AI calls)       |
| `SITE_URL`           | `http://localhost:5173` (required by `@convex-dev/auth`) |

### 5. Start the Dev Servers

Run both servers together:

```bash
pnpm run dev
```

This uses `concurrently` to start the Convex backend and Vite frontend in one terminal. You can also run them separately:

```bash
pnpm run dev:backend    # starts Convex dev server
pnpm run dev:frontend   # starts Vite dev server (in another terminal)
```

The app should load, auto-sign-in anonymously, and you can start chatting.

### 6. Run Backend Tests

```bash
pnpm run test:convex
```

These tests use `convex-test` which simulates the Convex runtime locally — no deployed project needed.

## How the Code Is Organized

Each domain (chats, messages) follows the same file pattern:

```plaintext
convex/
├── schema.ts              # Aggregates all table definitions
├── lib.ts                 # Auth-wrapped function builders (queryWithAuth, etc.)
├── auth.ts                # Anonymous auth config
├── auth.config.ts         # Auth provider configuration
├── http.ts                # HTTP router (CORS, auth middleware)
├── http_chat.ts           # SSE streaming endpoint
│
├── chats_schema.ts        # Table definition + validators
├── chats_guards.ts        # Ownership checks (throws 403/404)
├── chats_helpers.ts       # Pure DB operations (no auth logic)
├── chats_queries.ts       # Public read functions
├── chats_mutations.ts     # Public write functions
├── chats_actions.ts       # Side-effect functions (AI title suggestion)
│
├── messages_schema.ts     # Same pattern for messages
├── messages_guards.ts
├── messages_helpers.ts
├── messages_queries.ts
├── messages_mutations.ts
├── messages_internals.ts  # Internal functions (used by HTTP actions)
│
├── test.setup.ts          # Test helpers + module glob for convex-test
├── chats.test.ts          # Backend tests
└── messages.test.ts
```

The layering is: **guards** check authorization, **helpers** do the DB work, **queries/mutations** wire them together with auth. This separation means guards are reusable and helpers are testable without auth.

## Going to Production

### 1. Create a Production Convex Deployment

```bash
npx convex deploy
```

This creates a production deployment (separate from your dev deployment) and deploys all functions and schema to it. The first time, it will prompt you to choose between creating a new production deployment or using an existing one.

### 2. Set Production Environment Variables

On the Convex dashboard, switch to your **production** deployment and set:

| Variable             | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| `JWT_PRIVATE_KEY`    | Same private key (or generate a new pair for production) |
| `JWKS`               | Matching public key JSON                                 |
| `OPENROUTER_API_KEY` | Your production OpenRouter API key                       |
| `SITE_URL`           | Your production URL (e.g., `https://myapp.netlify.app`)  |

### 3. Get Your Deploy Key

For CI/CD (GitHub Actions), you need a deploy key:

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev/)
2. Select your project > **Settings** > **Deploy Key**
3. Copy the key

### 4. Add the Deploy Key to GitHub Secrets

1. Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions**
2. Add a new repository secret:

| Secret name         | Value                      |
| ------------------- | -------------------------- |
| `CONVEX_DEPLOY_KEY` | The deploy key from Step 3 |

### 5. How CI/CD Deploys

The CD workflow (`.github/workflows/cd.yml`) uses a single command that deploys Convex functions **and** builds the frontend:

```bash
npx convex deploy --cmd 'pnpm run build'
```

This does two things in order:

1. Deploys all Convex functions and schema to the production deployment
2. Runs `pnpm run build` which builds the Vite app with the production `VITE_CONVEX_URL` (injected by Convex)

The `CONVEX_DEPLOY_KEY` environment variable authenticates the deploy without interactive login.

## Common Issues

**"VITE_CONVEX_URL is not set"** — You haven't run `npx convex dev` yet, or `.env.local` is missing. Run `npx convex dev` to generate it.

**"Not authenticated" errors in the app** — The anonymous auth provider may not be configured. Check that `convex/auth.ts` exports the anonymous provider and that `SITE_URL` is set in the Convex dashboard environment variables.

**Functions not updating** — Make sure `npx convex dev` is running. It watches `convex/` and auto-deploys. If it crashed, restart it.

**Backend tests fail with "module not found"** — Run `npx convex dev` once to generate `convex/_generated/`. The test runner needs these generated files.

**"Schema mismatch" on deploy** — Your local schema differs from what's deployed. This usually means someone else deployed a different schema. Run `npx convex dev` to sync, resolve any conflicts, then redeploy.
