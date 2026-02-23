# Deployment Guide

This project deploys to [Netlify](https://www.netlify.com/) via GitHub Actions. When code is merged to `master`, the CD workflow builds the app and pushes the `dist/` folder to Netlify automatically.

The full production stack has three services:

1. **Mastra** — the AI agent server (deployed first, because Convex needs its URL)
2. **Convex** — the backend (database, auth, server functions)
3. **Netlify** — the static frontend (React/Vite SPA)

## Prerequisites

You need accounts on four platforms and two API keys before you begin.

| What                     | Where to sign up                                                                     | Why                                                            |
| ------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Netlify account**      | [netlify.com](https://www.netlify.com/) (free tier works)                            | Hosts the frontend SPA                                         |
| **Convex account**       | [convex.dev](https://www.convex.dev/) (free tier works)                              | Hosts the backend (database, auth, functions)                  |
| **Mastra Cloud account** | [cloud.mastra.ai](https://cloud.mastra.ai) (or self-host, see below)                 | Hosts the AI agent server for deep research                    |
| **GitHub repo admin**    | Your repository settings page                                                        | Required to add secrets for CI/CD                              |
| **OpenRouter API key**   | [openrouter.ai/keys](https://openrouter.ai/keys) (free credits available)            | Used by both Convex (normal chat) and Mastra (research agents) |
| **Exa API key**          | [dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys) (free tier available) | Used by Mastra's web search tool                               |

## Step 1 — Deploy Mastra

Mastra must be deployed first because the Convex production deployment needs the `MASTRA_URL` environment variable pointing to your running Mastra server.

You have three hosting options. Choose whichever fits your needs — the [Mastra guide](./mastra.md#deploying-to-production) covers each in full detail.

| Option                      | Best for                                     | Timeout limits      |
| --------------------------- | -------------------------------------------- | ------------------- |
| **Mastra Cloud** (simplest) | Quick setup, managed hosting                 | None                |
| **Netlify Functions**       | Colocation with frontend                     | 10s free / 26s paid |
| **Standalone Node.js**      | Full control (Railway, Render, Fly.io, etc.) | None                |

Regardless of which option you choose, set these environment variables on your Mastra hosting platform:

| Variable             | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| `OPENROUTER_API_KEY` | Your OpenRouter API key                                      |
| `EXA_API_KEY`        | Your Exa API key                                             |
| `MODEL`              | Default model ID (e.g., `openai/gpt-4o`)                     |
| `MODEL_MINI`         | Smaller model for summarization (e.g., `openai/gpt-4o-mini`) |

After deploying, note your Mastra server URL (e.g., `https://your-project.mastra.cloud`). You will need it in Step 2.

## Step 2 — Deploy Convex to Production

Create a production Convex deployment and configure its environment variables. The [Convex guide](./convex.md#going-to-production) covers this in full detail.

### 2a. Create the production deployment

```bash
npx convex deploy
```

The first time, it will prompt you to create a new production deployment (separate from your dev deployment).

### 2b. Set production environment variables

On the [Convex dashboard](https://dashboard.convex.dev/), switch to your **production** deployment and set:

| Variable             | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| `JWT_PRIVATE_KEY`    | Same private key (or generate a new pair for production) |
| `JWKS`               | Matching public key JSON                                 |
| `OPENROUTER_API_KEY` | Your production OpenRouter API key                       |
| `SITE_URL`           | Your production URL (e.g., `https://myapp.netlify.app`)  |
| `MASTRA_URL`         | Your deployed Mastra server URL from Step 1              |

> **Note:** `JWT_PRIVATE_KEY` and `JWKS` can be generated with `npx @convex-dev/auth`. You can reuse your dev keys or generate a fresh pair for production.

### 2c. Get your deploy key

The CD workflow needs a deploy key to authenticate with Convex:

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev/)
2. Select your project > **Settings** > **Deploy Key**
3. Copy the key — you will add it to GitHub in Step 5

## Step 3 — Create a Netlify Site

1. Log in to [Netlify](https://app.netlify.com/)
2. Click **Add new project** > **Import an existing project**
3. Choose **Deploy manually** (we handle builds in GitHub Actions, not Netlify)
   - Build your project with `pnpm run build` locally
   - Drag and drop the `dist` folder to the Netlify build step in the UI
4. Note your **Site ID** — you'll find it under **Project configuration** > **General** > **Project ID**

## Step 4 — Generate a Netlify Personal Access Token

1. Go to [User settings > Applications](https://app.netlify.com/user/applications)
2. Under **Personal access tokens**, click **New access token**
3. Give it a descriptive name (e.g., `github-actions-deploy`)
   - Set "No expiration" for the expiration date of the token.
4. Copy the token — you won't see it again

## Step 5 — Add Secrets to GitHub

1. Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions**
2. Add three repository secrets:

| Secret name          | Value                                 |
| -------------------- | ------------------------------------- |
| `NETLIFY_AUTH_TOKEN` | The personal access token from Step 4 |
| `NETLIFY_SITE_ID`    | The site ID from Step 3               |
| `CONVEX_DEPLOY_KEY`  | The deploy key from Step 2c           |

## Step 6 — Deploy

Push or merge to `master`. The CD workflow will:

1. Check out the code
2. Install dependencies with `pnpm install`
3. Deploy Convex functions and build the frontend with `npx convex deploy --cmd 'pnpm run build'`
4. Deploy the `dist/` folder to Netlify

You can monitor the deploy in the **Actions** tab of your GitHub repo.

## Production Environment Variables Summary

All environment variables across all three services in one checklist:

### Mastra hosting (Mastra Cloud / Netlify Functions / standalone server)

| Variable             | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `OPENROUTER_API_KEY` | OpenRouter key for research agents                           |
| `EXA_API_KEY`        | Exa key for web search tool                                  |
| `MODEL`              | Default model ID (e.g., `openai/gpt-4o`)                     |
| `MODEL_MINI`         | Smaller model for summarization (e.g., `openai/gpt-4o-mini`) |

### Convex production deployment

| Variable             | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `JWT_PRIVATE_KEY`    | Private key for signing session tokens                      |
| `JWKS`               | Public key JSON for verifying session tokens                |
| `OPENROUTER_API_KEY` | OpenRouter key for server-side AI calls (normal chat)       |
| `SITE_URL`           | Production frontend URL (e.g., `https://myapp.netlify.app`) |
| `MASTRA_URL`         | Deployed Mastra server URL                                  |

### GitHub Actions secrets

| Secret name          | Description                   |
| -------------------- | ----------------------------- |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID`    | Netlify site/project ID       |
| `CONVEX_DEPLOY_KEY`  | Convex production deploy key  |

## How It Works

### CI (Pull Requests)

Every PR against `master` triggers the CI workflow (`.github/workflows/ci.yml`), which runs type-checking, linting, and tests. PRs must pass CI before merging.

### CD (Merge to Master)

Every push to the deploy branch triggers the CD workflow (`.github/workflows/cd.yml`), which deploys Convex functions, builds the frontend, and deploys to Netlify. The build step uses `npx convex deploy --cmd 'pnpm run build'` to deploy backend and frontend in a single command.

### SPA Routing

The `public/_redirects` file tells Netlify to serve `index.html` for all routes. This is required for client-side routing (Wouter) to work — without it, refreshing on `/settings` would return a 404.

## Troubleshooting

**Build fails with "missing dependencies"** — Make sure `pnpm-lock.yaml` is committed. The CI/CD workflows use `pnpm install` (not `pnpm install --frozen-lockfile`), but a missing lockfile can still cause version mismatches.

**Deploy succeeds but site shows blank page** — Check the browser console for errors. Common causes: missing environment variables or a build that didn't include all assets.

**Routes return 404 on refresh** — Make sure `public/_redirects` exists and contains the SPA fallback rule. Vite copies everything in `public/` to `dist/` at build time.

**Research chats fail with "MASTRA_URL not configured"** — The Convex production deployment is missing the `MASTRA_URL` environment variable. Set it on the [Convex dashboard](https://dashboard.convex.dev/) to your deployed Mastra server URL (see Step 2b).

**Research chats return empty results** — Verify that `OPENROUTER_API_KEY` and `EXA_API_KEY` are set on your Mastra hosting platform (see Step 1). The agents fail silently if keys are missing.
