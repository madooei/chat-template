# Sentry Guide

Sentry is an error-tracking service that captures unhandled exceptions, logs them with full stack traces, and sends you alerts. Instead of discovering bugs from user complaints or digging through console logs, you see every error in a dashboard with the exact line of code, the component tree, and the browser/OS context.

This project integrates Sentry on two levels:

- **Frontend** — the `@sentry/react` SDK captures React rendering errors, uncaught exceptions, and unhandled promise rejections in the browser
- **Backend** — Convex's built-in Sentry integration forwards all unhandled server-side errors from queries, mutations, and actions

## Setting Up a Sentry Account

1. Go to [sentry.io/signup](https://sentry.io/signup/) and create a free account. The free tier includes 5,000 errors/month — more than enough for development.

2. When prompted, create an **organization** (e.g., your team name or GitHub username). This becomes your **org slug** used in configuration.

3. Create a new **project**:
   - Navigate to **Settings > Projects > Create Project**
   - Select **React** as the platform
   - Name it something like `chat-template`
   - This name becomes your **project slug**

4. After creating the project, Sentry shows your **DSN** (Data Source Name). It looks like:

   ```plaintext
   https://abc123@o123456.ingest.us.sentry.io/789
   ```

   Copy this — you'll need it for the frontend. The DSN is safe to expose publicly; it only allows _sending_ events, not reading them.

5. Generate an **Organization Auth Token** for source map uploads:
   - Go to **Settings > Developer Settings > Organization Tokens**
   - Click **Create New Token**
   - Give it a name like `chat-template-sourcemaps`
   - Organization tokens have fixed permissions scoped to CI tasks (source map uploads, release management) — no custom scopes needed
   - Copy the token immediately — it's only shown once and cannot be retrieved later

   > **Why Organization Tokens?** Sentry has three token types: Organization, Internal Integration, and Personal. Organization tokens are recommended for CI/build tasks like source map uploads because they have limited, fixed permissions (least-privilege) and are tied to the org rather than a specific user. If a team member leaves, the token keeps working.

## Environment Variables

Sentry is **production-only**. During local development, the DSN is not set, so Sentry is completely disabled — errors only appear in the browser console and React's dev-mode error overlay, which is all you need when developing.

The following variables are set as **GitHub Actions secrets** and injected during the production build. Do **not** add them to `.env.local`:

| Variable            | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `VITE_SENTRY_DSN`   | Frontend DSN — baked into the JS bundle at build time |
| `SENTRY_AUTH_TOKEN` | Organization token for source map uploads (secret)    |
| `SENTRY_ORG`        | Your Sentry org slug                                  |
| `SENTRY_PROJECT`    | Your Sentry project slug                              |

To add these in GitHub:

1. Go to your repository on GitHub
2. Navigate to **Settings > Secrets and variables > Actions**
3. Click **New repository secret** for each variable

The CD workflow (`.github/workflows/cd.yml`) already passes these secrets to the build step:

```yaml
- name: Deploy Convex and Build
  run: npx convex deploy --cmd 'pnpm run build'
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
    VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
```

Since `VITE_SENTRY_DSN` is a Vite variable (prefixed with `VITE_`), it gets embedded into the JavaScript bundle at build time. If it's empty or missing — as it is during local development — Sentry is completely disabled and the app runs normally.

## How It Works — Frontend

### Initialization

Sentry is initialized in `src/main.tsx` before React renders. This ensures it captures errors from the very first render:

```typescript
import * as Sentry from "@sentry/react";
import { SENTRY_DSN } from "@/config/env";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});
```

### React 19 Error Hooks

React 19 exposes three error callbacks on `createRoot` that Sentry hooks into:

| Hook                 | When it fires                                    |
| -------------------- | ------------------------------------------------ |
| `onUncaughtError`    | Error thrown and NOT caught by any ErrorBoundary |
| `onCaughtError`      | Error caught INSIDE an ErrorBoundary             |
| `onRecoverableError` | React automatically recovers from an error       |

These are wired up using `Sentry.reactErrorHandler()`, so every React error is automatically reported to Sentry with the full component stack trace.

### Error Boundary

The app wraps `<App />` in `Sentry.ErrorBoundary`, which:

1. Catches any rendering error in the component tree
2. Reports it to Sentry with component stack context
3. Shows the `ErrorFallback` UI (the "Something went wrong" page)

### Manual Error Capture

For errors that don't crash the UI (e.g., a failed API call you handle gracefully), you can report them manually:

```typescript
import * as Sentry from "@sentry/react";

try {
  await riskyOperation();
} catch (err) {
  Sentry.captureException(err);
  // Show a toast or fallback UI instead of crashing
}
```

You can also send informational messages:

```typescript
Sentry.captureMessage("User hit rate limit", "warning");
```

### Source Maps

The `@sentry/vite-plugin` in `vite.config.ts` uploads source maps during production builds. This means stack traces in Sentry show your original TypeScript code rather than minified JavaScript. The source maps are deleted from the build output after upload so they're not deployed publicly.

## How It Works — Backend (Convex)

Convex offers a built-in Sentry integration that automatically forwards all unhandled errors from your server-side functions. This requires the **Convex Pro plan** and is configured on the **production deployment** only — you don't need it for local development.

### Setup

1. Open the [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your **production** deployment
3. Go to **Settings > Integrations**
4. Find the **Sentry** card and click **Configure**
5. Enter your Sentry DSN (the same one used for `VITE_SENTRY_DSN`)
6. Save

That's it — no code changes needed. Every unhandled exception in your queries, mutations, actions, and HTTP endpoints is automatically reported to Sentry. If the function runs in an authenticated context, Convex attaches the user's `tokenIdentifier` to the Sentry event.

### Limitations

- **Pro plan only** — the free Convex tier does not support the Sentry integration
- **No custom enrichment** — you cannot add custom tags, breadcrumbs, or extra context to events (unlike the frontend SDK)
- **1-2 minute delay** — errors may take a minute or two to appear in Sentry
- **Unhandled errors only** — if you `catch` an error in your function, it won't be reported unless you re-throw it

### During Development

Even without the Sentry integration, you have full error visibility locally through Convex's built-in tools:

- **Dashboard Logs** — the Convex dashboard shows the last 1,000 function executions with console output and error details
- **CLI Logs** — run `npx convex logs` to stream logs to your terminal in real time
- **Request IDs** — every error includes a Request ID you can paste into the dashboard to find the associated logs

The frontend Sentry integration (when enabled in production) also captures errors that happen in the browser, including failed network requests to your Convex backend.

## Verifying the Integration

### Frontend

After deploying a production build with the Sentry env vars set:

1. Open your deployed app in the browser
2. Open the browser console and run:
   ```javascript
   Sentry.captureMessage("Test from production");
   ```
3. Check your Sentry dashboard — the message should appear within seconds

If you need to test locally before deploying, you can temporarily set `VITE_SENTRY_DSN` in `.env.local`, restart the dev server, and verify events appear in Sentry. Remove it when you're done.

### Backend (Pro Plan)

1. Enable the Sentry integration on your production deployment in the Convex Dashboard
2. Trigger an error in a Convex function (e.g., query a non-existent document without null-checking)
3. Check Sentry after 1-2 minutes

## Alerts

Once errors are flowing into Sentry, set up alerts so you don't have to check the dashboard manually:

1. Go to **Alerts > Create Alert Rule**
2. Choose "When new issues are created" for the simplest setup
3. Configure the notification channel (email is the default, Slack and others are available)
4. Set the frequency to avoid alert fatigue (e.g., once per issue, not every occurrence)
