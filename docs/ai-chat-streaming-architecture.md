# AI Chat Streaming Architecture

How streaming AI responses flow from server to screen, and why it's harder than it looks.

---

## The Problem

When a user sends a message in a chat application that uses an AI provider, the AI generates a response. If we wait for the entire response before showing it, the UX is terrible -- the user stares at a spinner for seconds (or minutes for long responses). So we enable streaming: the AI sends tokens as they're generated, and we display them incrementally.

The challenge is that streaming creates a conflict between **real-time display** and **data persistence**. We need to show tokens immediately AND store the response reliably. These two goals pull in opposite directions.

### Attempt 1: Store Every Chunk in the Database

The first instinct is to write each chunk to the database as it arrives and let the database's reactivity (Convex's real-time WebSocket subscriptions) push updates to the frontend.

```plaintext
AI generates token
  -> Server writes updated message to Convex DB
  -> Convex reactive query pushes update to client
  -> Client re-renders
```

This fails for two reasons:

1. **Write amplification.** Every token triggers a full database write. If the AI is generating an essay and is halfway through, one more token (a comma) causes the server to overwrite the entire accumulated text in the DB. The same large payload is then pushed to the frontend via the reactive subscription. For a 2000-word essay, that's ~2000 write operations, each progressively larger. This degrades performance and costs real money on usage-based backends like Convex.

2. **Granularity mismatch.** Database writes and reactive subscriptions have latency. Tokens arrive faster than the DB can write-and-propagate, so the UI updates in jarring bursts rather than a smooth character-by-character flow.

### Attempt 2: SSE Stream to Client, Save on Completion

The second approach separates the concerns: stream tokens directly to the client via Server-Sent Events (SSE) for real-time display, and save the complete message to the database only when the stream finishes.

```plaintext
AI generates token
  -> Server sends token via SSE to client (real-time display)
  -> Client accumulates tokens in local state
  -> Stream ends
  -> Server saves complete message to DB
  -> Convex reactive query delivers persisted message to client
  -> Client transitions from streaming state to persisted state
```

This is better but has UX problems at the **handoff point**:

- **Flash of disappearing content.** When the stream ends, the client clears its streaming state. The persisted message from Convex hasn't arrived yet (there's a small delay). For a brief moment, the AI response disappears from the screen, then reappears. Users notice this.

- **Brief duplication.** Sometimes the timing works out such that the persisted message arrives before the streaming state is cleared. The user sees the same message twice for a fraction of a second.

- **No crash recovery.** If the client disconnects mid-stream (refresh, crash, network drop), the response is lost. The server may still be generating tokens, but with no SSE connection, they go nowhere. The complete message never gets saved to the DB because the stream never finishes cleanly. (This can be mitigated by having the server accumulate and save regardless of client state, which is what our current implementation does -- but the client still loses its place.)

### What We Actually Need

The ideal architecture has these properties:

1. **Token-by-token display** -- the client sees each token as it's generated, with no perceptible latency.
2. **Durable persistence** -- the response is saved to the database in a way that doesn't require the client to be connected.
3. **No handoff artifacts** -- no flashing, no duplication, no gaps when transitioning from "streaming" to "persisted."
4. **Crash recovery** -- if the client disconnects and reconnects, it picks up where it left off without losing content.
5. **Cost-efficient writes** -- the database isn't hammered on every token.

---

## The Solution: Dual-Channel Streaming with Local-First State

The architecture uses two simultaneous data channels feeding into a single local-first state layer (Legend-State), which is the sole source of truth for the UI.

```plaintext
                               AI Provider (OpenRouter)
                                     |
                                     | token stream
                                     v
                              Convex HTTP Action
                                   /    \
                                  /      \
                 SSE (token-by-token)    DB flush (batched, periodic)
                        |                       |
                        v                       v
                   Client SSE              Convex DB
                    consumer                    |
                        |                       | reactive subscription
                        v                       v
                   Legend-State    <--- reconciliation --->    Legend-State
                  (streaming obs)                           (persisted obs)
                        \                     /
                         \                   /
                          v                 v
                       UI renders max(streaming, persisted)
```

### How It Works

**Channel 1: SSE (real-time, ephemeral)**

The server streams tokens to the client via SSE as they're generated. The client appends each token to a Legend-State streaming observable. This is the fast path -- tokens appear on screen within milliseconds of generation.

**Channel 2: Convex DB (batched, durable)**

The server also accumulates tokens and periodically flushes to the Convex database -- not on every token, but at sensible intervals (e.g., every ~200ms or every N characters, whichever comes first). These flushes are partial: they save the message content accumulated so far, marked as incomplete. When the stream finishes, a final flush saves the complete message.

Because Convex queries are reactive, each DB flush triggers a subscription update that pushes the partial content to the client. This content arrives through Legend-State's persisted observable.

**Reconciliation**

Legend-State holds two pieces of state for an in-progress assistant message:

- `streamingContent` -- fed by SSE, always the most up-to-date
- `persistedContent` -- fed by Convex reactive query, always behind or equal to streaming

The UI always displays `streamingContent` when it exists (because it's ahead). When the stream ends, `streamingContent` is cleared -- but only after `persistedContent` has caught up (the final DB flush has been received via the reactive subscription). This eliminates the flash/gap problem.

```plaintext
Timeline:

t0: User sends message
t1: SSE starts, tokens flow          streamingContent = "The"
t2:                                   streamingContent = "The answer"
t3: First DB flush (200ms)            persistedContent = "The answer is"
t4:                                   streamingContent = "The answer is 42"
t5: Second DB flush (400ms)           persistedContent = "The answer is 42."
t6: Stream ends, final DB flush
t7: Convex delivers final message     persistedContent = "The answer is 42."
t8: streamingContent cleared           UI shows persistedContent (no gap)
```

### Crash Recovery

If the client disconnects at t4:

- The server continues generating tokens and flushing to DB (it doesn't need the SSE connection for this -- the AI stream runs server-side in a Convex action).
- When the client reconnects, it has no SSE stream, but the Convex reactive subscription resumes.
- `persistedContent` updates as DB flushes continue.
- The user sees the response continuing at paragraph-level granularity (DB flush intervals) instead of token-by-token, but no content is lost.

### The User Message Path (Local-First Writes)

User messages follow a local-first pattern:

1. User presses Send.
2. The message is written to Legend-State immediately (instant UI feedback).
3. A Convex mutation persists it to the DB.
4. Convex's reactive subscription delivers the persisted version back.
5. Legend-State reconciles: the local version and server version represent the same message (matched by client-generated ID), so the local version is silently replaced by the server version.

This uses client-generated UUIDs (stored as `clientId` on the Convex table) so Legend-State can match local and server records before the server-assigned `_id` exists.

---

## Why Legend-State

Legend-State was chosen for this architecture because of its built-in sync engine:

- **`synced()` with `debounceSet`** -- batches local writes to the server, preventing keystroke-level DB hits.
- **`persist` with `retrySync`** -- survives page refresh; queued mutations retry automatically.
- **Fine-grained reactivity** -- only the specific observable that changed triggers a re-render, not the entire message list.
- **`batch()` for reconciliation** -- server data can be merged into observables without triggering re-sync loops.

The key architectural role of Legend-State is as the **single source of truth for the UI**. Both data channels (SSE and Convex reactive queries) feed into it, and the UI only reads from it. This centralizes the reconciliation logic in one place.

---

## Libraries Involved

| Library                           | Role in This Architecture                                                      |
| --------------------------------- | ------------------------------------------------------------------------------ |
| **Vercel AI SDK (`ai`)**          | `streamText()` on the server -- produces the token stream from the AI provider |
| **`@openrouter/ai-sdk-provider`** | Connects AI SDK to OpenRouter (multi-provider gateway)                         |
| **Hono (`hono/streaming`)**       | `streamSSE()` -- formats and writes SSE events to the HTTP response            |
| **Convex**                        | Database, reactive subscriptions (WebSocket), HTTP actions, mutations          |
| **`@convex-dev/auth`**            | Anonymous authentication, JWT tokens                                           |
| **Legend-State**                  | Local-first state, sync engine, reconciliation, persistence                    |
| **`use-stick-to-bottom`**         | Auto-scroll chat container during streaming                                    |

---

## Server-Side Batched Flush Strategy

The server accumulates tokens and flushes to the DB at controlled intervals:

```plaintext
Configuration:
  FLUSH_INTERVAL = 200ms        -- minimum time between DB writes
  MIN_FLUSH_SIZE = 100 chars    -- minimum content to justify a flush

Algorithm:
  buffer = ""
  lastFlushTime = now()

  for each token from AI stream:
      buffer += token
      send token via SSE to client

      if (buffer.length >= MIN_FLUSH_SIZE AND now() - lastFlushTime >= FLUSH_INTERVAL):
          upsert message in DB (content = accumulated_so_far, isComplete = false)
          buffer = ""
          lastFlushTime = now()

  -- Stream ended --
  upsert message in DB (content = full_text, isComplete = true)
  send [DONE] via SSE
```

This means the DB sees ~5 writes per second at most, regardless of how fast tokens arrive. For a typical response, that might be 5-15 total DB writes instead of hundreds.

---

## Client-Side Reconciliation Logic

```plaintext
For each assistant message being streamed:

  if (isStreaming AND streamingContent exists):
      display streamingContent              -- SSE is ahead, show it
  else if (persistedContent exists):
      display persistedContent              -- no active stream, show DB version
  else:
      display nothing (or "Thinking...")    -- waiting for first token

On stream end ([DONE] received):
  wait until persistedContent.isComplete == true
  then clear streamingContent
  -- UI seamlessly shows persistedContent (which has the same text)
```

The "wait until persisted is complete" step is what eliminates the flash. We don't clear the streaming state until we're certain the DB version is ready to take over.

---

## Convex Schema Additions

To support this architecture, the messages table gains two fields:

```plaintext
messages table:
  chatId          -- foreign key to chats
  userId          -- foreign key to users
  clientId        -- client-generated UUID (for local-first reconciliation)
  role            -- "user" | "assistant"
  content         -- message text (partial during streaming, complete after)
  isComplete      -- false during streaming, true when done
  model           -- which AI model generated this (optional)

indexes:
  by_chat_id      -- [chatId]
  by_client_id    -- [clientId]
  by_user_id      -- [userId]
```

The `clientId` field enables Legend-State to match a locally-created message with its server-persisted counterpart. The `isComplete` field lets the client know when the DB version is final and it's safe to stop showing the streaming overlay.

---

## Trade-offs and Limitations

**What this architecture handles well:**

- Smooth streaming UX with no handoff artifacts
- Client crash recovery (server continues, client catches up via DB)
- Cost-efficient DB writes (batched, not per-token)
- Offline resilience for user messages (Legend-State queues and retries)

**What this architecture does NOT handle:**

- True multi-device sync (if user opens chat on two devices, the SSE stream only goes to the device that initiated it; the other device sees DB-granularity updates)
- Conflict resolution for concurrent edits (not needed -- only one writer per message)
- Streaming resume on reconnect (if SSE drops, client falls back to DB-granularity; it doesn't re-establish the SSE stream mid-response)

**Resolved decisions (from implementation):**

- Flush interval set to 200ms with minimum 100 chars per flush. Patches the same `messages` row (no separate chunks table).
- Legend-State uses plain `observable()` instead of `synced()`. A React `useEffect` bridges Convex reactive queries into the store. This avoids the need for a custom Convex sync plugin.
- Handoff uses 50ms polling with 5s timeout: after `[DONE]`, the client polls the Legend-State persisted array for a message matching the `messageId` with `isComplete !== false` before clearing streaming state.
- User messages use `clientId` (via `crypto.randomUUID()`) for optimistic reconciliation. The optimistic message is removed from Legend-State when a persisted message with the same `clientId` arrives via the Convex subscription.

**Open questions:**

- Exact flush interval and minimum flush size may need tuning based on real usage patterns
- Whether to add Legend-State `synced()` with a custom Convex plugin in the future for offline resilience
