# Messages

## Purpose

Enables real-time conversational interaction between the user and an AI assistant within a chat. Handles composing, sending, streaming, displaying, and managing messages so users can have fluid back-and-forth conversations with visible typing feedback.

## Scope

**Does:**

- Display messages in a scrollable, auto-stick-to-bottom chat view
- Distinguish user messages (right-aligned) from assistant messages (left-aligned)
- Render assistant responses as markdown with syntax-highlighted code blocks
- Stream assistant responses in real-time with a "Thinking" shimmer indicator
- Allow the user to abort a streaming response mid-generation
- Copy any message's text to clipboard
- Persist all messages to localStorage keyed by chat ID
- Show an empty state with suggested prompts when a chat has no messages
- Auto-generate a chat title after the first assistant response in a "New Chat"
- Validate that a Gemini API key exists before sending requests
- Track request IDs to prevent race conditions from overlapping streams
- Clean up abort controllers and pending state on component unmount

**Does NOT:**

- Manage chat CRUD (creating, renaming, deleting chats) -- owned by `chats` feature
- Store or manage the API key -- owned by `settings` feature
- Handle routing or navigation -- owned by `app/router`
- Implement model switching (placeholder only)
- Implement message editing, regeneration, or feedback (placeholders only)
- Implement file attachments, voice input, or read-aloud (placeholders only)
- Sync messages to a server or database (localStorage only)

## Key Behaviors

1. When a user types a message and presses Enter, the message appears immediately as a user bubble and streaming begins
2. When a user presses Shift+Enter, a newline is inserted instead of sending
3. When a response is streaming, a stop button replaces the send button; clicking it aborts generation
4. When streaming starts before any content arrives, a "Thinking" shimmer loader is shown
5. When streaming content arrives, it renders incrementally as markdown
6. When streaming completes, the full response is saved as an assistant message
7. If the Gemini API key is missing, an error toast is shown and no request is sent
8. If the chat title is still "New Chat" after the first assistant response, a title is auto-generated from conversation context
9. When a user hovers over a message on desktop, action buttons fade in; on mobile they are always visible
10. When the message list is empty, four suggested prompts are shown; clicking one populates the input
11. When a chat is deleted (externally), `removeMessagesByChatId` cleans up its messages

## Dependencies

- `chats` -- `$chats` store and `updateChat` for auto-titling after first response
- `chats` -- `useQueryChat` hook to display the chat title in the page header
- `settings` -- `getSettings()` to retrieve the Gemini API key before sending
- `app/router` -- `$router` for back-navigation on mobile
- `lib/ai` -- `streamChat()` and `generateChatTitle()` wrapping Vercel AI SDK with Google provider
- External: `nanostores` + `@nanostores/react` -- state management and persistence
- External: `sonner` -- toast notifications
- External: `lucide-react` -- icons
- External: `react-markdown` + `shiki` -- markdown rendering with syntax highlighting
- External: `zod` -- schema validation for persisted messages

## Known Gaps

- Model selector is a static placeholder; switching models has no effect
- Message editing, regeneration, feedback (thumbs up/down), read-aloud, file attachment, voice input, and chat export are all unimplemented placeholders
- No server-side persistence; messages live only in localStorage
- Query hooks always return `loading: false` and `error: false` (synchronous reads)
- No optimistic rollback if streaming fails partway (partial responses are lost)
- No multi-tab synchronization for localStorage changes
- Suggested prompts in the empty state are hardcoded

## Files

| File                             | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `types/message.ts`               | Zod schemas and TypeScript types for messages        |
| `store/message.ts`               | Persistent nanostores atom and CRUD operations       |
| `hooks/use-chat.ts`              | Core streaming logic, abort handling, auto-titling   |
| `hooks/use-query-messages.ts`    | Query messages filtered by chat ID                   |
| `hooks/use-query-message.ts`     | Query a single message by ID                         |
| `hooks/use-mutation-messages.ts` | Create a new message                                 |
| `hooks/use-mutation-message.ts`  | Edit or delete a single message                      |
| `components/message.tsx`         | Individual message bubble with action buttons        |
| `components/message-input.tsx`   | Prompt input with attachment/voice/send/stop actions |
| `components/message-list.tsx`    | Message list with empty state, streaming, and loader |
| `pages/messages-page.tsx`        | Full page composing header, message list, and input  |
