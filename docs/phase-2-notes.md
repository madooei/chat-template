# Phase 2 — Bring a Backend (Convex)

Living document for Phase 2 decisions, architecture, and research findings.

---

## Decisions

- **D1 — Use Convex `useQuery`/`useMutation` for data reads/writes**, not Legend-State sync engine. Convex reactive queries already handle real-time updates over WebSocket. Wrapping them in Legend-State sync adds complexity without benefit. Legend-State stays for transient/local state (streaming, UI preferences).

- **D2 — Single server-side API key** stored as Convex env variable (`OPENROUTER_API_KEY`). Simplifies architecture — keys never leave the server. No per-user key management. Settings page loses the API key field.

- **D3 — Anonymous auth via `@convex-dev/auth`** from day 1. Every visitor gets a `userId` automatically. All Convex skills work (queryWithAuth, guards, ownership). Phase 4 upgrades to real auth by linking anonymous accounts. Abuse risk acceptable for a teaching template.

- **D4 — AI calls move server-side** into Convex HTTP actions. Core Phase 2 goal. Vercel AI SDK's `streamText()` runs inside Convex actions. Client no longer needs API keys or direct AI provider access.

- **D5 — SSE streaming from Convex HTTP endpoint**, not DB-mediated chunk streaming. Direct SSE pipe: action streams tokens → SSE → client. Full response saved to DB only after completion. Avoids high write volume and the "message chunks" table complexity of the DB-mediated approach.

- **D6 — Message history read server-side from DB.** The HTTP action reads chat history from the database using `chatId`. No large message payloads sent from frontend. Cleaner, more secure, and the action already has DB access.

- **D7 — Hono as HTTP framework** inside Convex HTTP actions. Lightweight, well-supported in Convex ecosystem. Provides `streamSSE()`, middleware, CORS, routing. Used successfully in the flashcards reference project.

- **D8 — Hooks API shape stays the same** for components. `useQueryChats()` still returns `{ data }`. `useMutationChat()` still returns `{ edit, delete }`. Internals change from Legend-State/IndexedDB to Convex, but components don't know the difference.

---

## Architecture Overview

### Phase 1 → Phase 2 Shift

```plaintext
PHASE 1 (frontend only)                    PHASE 2 (with Convex backend)
─────────────────────────                   ─────────────────────────────
Browser calls AI directly                   Convex HTTP action calls AI
API key in localStorage                     API key in server env variable
Data in IndexedDB/localStorage              Data in Convex database
Legend-State observables for everything      Convex useQuery for data, Legend-State for transient state
No auth                                     Anonymous auth (@convex-dev/auth)
Client-generated UUIDs                      Server-generated _id (Convex system fields)
```

### Data Flow

```plaintext
FRONTEND (React)                      CONVEX BACKEND                    AI PROVIDER
────────────────────────────────────────────────────────────────────────────────────

                                 ┌─ Schema (chats, messages, users)
                                 ├─ Queries (getChats, getMessages)
                                 ├─ Mutations (createChat, createMessage)
                                 ├─ HTTP Actions (POST /api/chat → SSE stream)
                                 └─ Auth (anonymous via @convex-dev/auth)

React components
  ↕ (same API as Phase 1)
Hooks layer
  ↕ (internals changed)
Convex React hooks (useQuery, useMutation)     ←→  Convex DB (reactive WebSocket)
Legend-State observables (streaming state)

HTTP POST /api/chat  ──────────────────────→  HTTP Action
SSE stream  ← ← ← ← ← ← ← ← ← ← ← ← ← ←  streamText() ──→ OpenRouter/etc
```

### The Streaming Dance

```plaintext
1. User sends message
   ├─ Frontend calls Convex mutation to save user message
   └─ Frontend POSTs to /api/chat (expects SSE back)

2. Convex HTTP action receives request
   ├─ Auth middleware validates token → gets userId
   ├─ Verifies chat ownership (guard)
   ├─ Reads message history from DB
   ├─ Calls streamText() with server-side API key
   └─ Pipes token stream as SSE to client

3. Frontend receives SSE chunks
   ├─ Legend-State $streamingContent observable updates per chunk
   └─ <MessageList> renders streaming preview

4. Stream ends
   ├─ Action saves assistant message to DB (internal mutation)
   ├─ Sends SSE "[DONE]" signal
   ├─ Frontend clears streaming state
   └─ Convex reactive query delivers persisted message
       → <MessageList> renders from DB (seamless handoff)
```

---

## Schema Design

### Convex Tables

```typescript
// chats
{
  title: v.string(),
  userId: v.id("users"),
}
// Indexes: by_user_id

// messages
{
  chatId: v.id("chats"),
  userId: v.id("users"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  model: v.optional(v.string()),  // which model generated this response
}
// Indexes: by_chat_id, by_user_id
```

System fields `_id` and `_creationTime` provided by Convex automatically.

### Mapping from Phase 1 Types

- `ChatType._id` (client UUID) → `Doc<"chats">._id` (server-generated). No more `crypto.randomUUID()`.
- `ChatType._creationTime` (client timestamp) → `Doc<"chats">._creationTime` (server). Convex sets this automatically.
- `MessageType.chatId` (string) → `Id<"chats">`. Typed foreign key.
- `SettingsType.openRouterApiKey` → Gone (server env var). Settings page changes.

---

## Store Migration Plan

### What Goes Away

- `src/store/persisted-observable.ts` — replaced by Convex queries
- `src/store/persisted-idb-observable.ts` — replaced by Convex queries
- `src/store/idb.ts` — IndexedDB no longer needed for data
- `src/lib/ai.ts` — AI calls move to Convex actions
- `src/chats/store/chat.ts` — replaced by Convex query/mutation hooks
- `src/messages/store/message.ts` — replaced by Convex query/mutation hooks

### What's New

- **Convex schema** — `convex/chats_schema.ts`, `convex/messages_schema.ts`, `convex/schema.ts` (table definitions)
- **Convex functions** — `convex/chats_*.ts`, `convex/messages_*.ts` (CRUD queries/mutations)
- **Convex HTTP** — `convex/http.ts`, `convex/http_chat.ts` (HTTP router, SSE streaming)
- **Convex auth** — `convex/auth.ts`, `convex/lib.ts` (anonymous auth, wrappers)
- **Frontend provider** — Convex client provider in App (connects React to Convex)
- **Streaming state** — Legend-State observables (`$streamingContent`, `$isStreaming`)
- **SSE consumer** — utility hook or function (parses SSE from HTTP endpoint)

### What Changes (Same API, Different Internals)

- `useQueryChats()` — was: reads Legend-State `$chats` observable → now: wraps Convex `useQuery(api.chats_queries.getAll)`
- `useQueryChat(id)` — was: filters `$chats` by ID → now: wraps Convex `useQuery(api.chats_queries.getOne, { chatId })`
- `useMutationChats()` — was: calls `addChat()` on observable → now: wraps Convex `useMutation(api.chats_mutations.create)`
- `useMutationChat(id)` — was: calls `updateChat()`/`removeChat()` → now: wraps Convex `useMutation(api.chats_mutations.update/remove)`
- `useQueryMessages(chatId)` — was: filters `$messages` by chatId → now: wraps Convex `useQuery(api.messages_queries.getByChat, { chatId })`
- `useChat(chatId)` — was: calls `streamChat()` directly → now: POSTs to `/api/chat`, consumes SSE, manages Legend-State streaming state

### What Stays

- **Components** — no changes needed (they talk to hooks, not stores)
- **Settings store** — keeps Legend-State + localStorage for display name, preferences (no API key)
- **Types** — updated to match Convex types but same conceptual shape
- **UI** — identical user experience

---

## Auth Setup (Anonymous)

```typescript
// convex/auth.ts
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous],
});
```

Frontend auto-signs-in on first visit:

```typescript
// On app load or first interaction
signIn("anonymous");
```

Phase 4 upgrade path: add real auth providers (OAuth, email), implement account linking for anonymous → authenticated migration.

### Security Notes

- Anonymous auth means any client can create a user and write data
- Acceptable for a teaching template
- CAPTCHA (hCaptcha or Cloudflare Turnstile) can be added in Phase 4
- Ownership guards still prevent cross-user data access

---

## HTTP Endpoint Architecture

### Stack

- **Hono** — lightweight HTTP framework inside Convex actions
- **SSE** — Server-Sent Events via Hono's `streamSSE()` helper
- **CORS** — middleware for cross-origin requests (frontend ↔ Convex)
- **Auth middleware** — validates Bearer token, extracts userId

### Route Structure

```plaintext
POST /api/chat     → Stream AI response (SSE)
```

May expand later:

```plaintext
POST /api/title    → Generate chat title (non-streaming)
```

### Middleware Chain

```plaintext
Request → CORS → Auth (validate token, inject userId) → Route handler
```

---

## AI Provider Integration

### Server-Side Vercel AI SDK

```typescript
// Inside Convex HTTP action
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const result = streamText({
  model: openrouter(requestedModel),
  messages: messagesFromDB,
});

// Pipe to SSE
for await (const chunk of result.textStream) {
  await stream.writeSSE({ data: chunk });
}
```

### Models

Same model list as Phase 1 (configured in `src/config/models.ts`):

- `anthropic/claude-sonnet-4-5` (default)
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `google/gemini-2.0-flash-001`
- `meta-llama/llama-3.3-70b-instruct`

Model selection sent in the HTTP request body. The server doesn't restrict models (for now).

---

## Skills to Create

### convex-http

Convex HTTP endpoints with Hono, SSE streaming, CORS, auth middleware. Covers:

- Setting up `http.ts` with Hono
- Auth middleware pattern (token validation)
- SSE streaming with `streamSSE()`
- CORS configuration
- Route organization

### chat-streaming (or similar)

The end-to-end streaming dance. Covers:

- Frontend SSE consumer pattern
- Legend-State streaming observables
- The streaming → persisted handoff
- Abort/cancellation handling
- Error handling and recovery
- The "F5 problem" and how our architecture handles it

---

## Research Sources

- **[Arham's blog post](https://www.arhamhumayun.com/blog/streamed-ai-response)** — DB-mediated streaming (chunks table, 200ms flush) solves F5 problem but adds write load and latency.
- **Migration guide** (`migration-guide-legend-state-wouter.md`) — Legend-State sync engine + Convex needs client-generated UUIDs and custom sync plugin. No official `syncedConvex` plugin exists.
- **Flashcards app** (`proj-flashcards-app`) — HTTP endpoint + SSE approach: Hono inside Convex, `streamSSE()`, nanostores for transient state. Full response saved after completion. Agentic loop support.
- **Convex Auth anonymous docs** — `signIn("anonymous")` creates session without login. Warn about abuse → CAPTCHA recommended for production. Account linking available for upgrade to real auth.

---

## Open Items / Future Decisions

All items resolved during Phase 2 implementation:

- [x] **Auto-title generation:** Uses inline auto-title during streaming — after the first assistant response in a "New Chat", the HTTP action generates a title via a second `streamText()` call and saves it with an internal mutation. No separate endpoint needed.
- [x] **Conversation context window:** Sends all messages to the AI provider. Documented as a known gap in both `src/chats/SPEC.md` and `src/messages/SPEC.md`.
- [x] **System prompt:** Hardcoded as a weather assistant in `convex/http_chat.ts`. Documented as a known gap in both SPECs.
- [x] **Settings page:** API key field removed (server-side env var now). Only `displayName` remains in settings, backed by Legend-State + localStorage.
- [x] **Model persistence:** Session-only — model selection is not persisted per chat. Documented as a known gap in both SPECs.
- [x] **AI SDK runtime compatibility:** Confirmed working. Vercel AI SDK's `streamText()` runs inside Convex HTTP actions with `@openrouter/ai-sdk-provider`.
- [x] **Hono SSE behavior:** Confirmed working. Hono's `streamSSE()` inside Convex HTTP actions streams correctly with no known gotchas.
- [x] **Phase 1 data migration:** Clean break, no migration. Phase 2 uses a completely separate Convex backend. Phase 1 IndexedDB/localStorage data is irrelevant.
