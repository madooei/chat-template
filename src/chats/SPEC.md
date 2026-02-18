# Chats

## Purpose

Lets users manage multiple independent conversations so they can organize topics, revisit past discussions, and start fresh threads without losing history. Serves as the primary navigation surface for the application.

## Scope

**Does:**

- Create new chats with a default "New Chat" title
- List all chats in a sidebar grouped by date (Today, Yesterday, Previous 7 days, Older)
- Filter chats by title with case-insensitive search
- Toggle sort order between newest-first and oldest-first
- Edit chat titles manually via a dialog
- Suggest AI-generated titles from conversation history (requires OpenRouter API key and at least one message)
- Delete chats with a confirmation dialog, cascading to remove all associated messages
- Navigate to a chat's message view on selection
- Highlight the currently active chat in the sidebar
- Show relative timestamps (just now, 2m ago, 3h ago, 2d ago, then short date)
- Display contextual empty states for no chats and no search results
- Persist all chat data to IndexedDB with Zod-validated decoding
- Close the sidebar on mobile after chat selection

**Does NOT:**

- Store or display message content (owned by `messages` feature)
- Handle message sending, streaming, or AI responses
- Manage API keys or settings (owned by `settings` feature)
- Provide sidebar layout or toggle behavior (owned by `layout` feature)
- Sync data across devices or to a backend
- Paginate the chat list

## Key Behaviors

1. When user clicks "New Chat", a chat titled "New Chat" is created and the app navigates to its message view
2. When user searches, the chat list filters to titles containing the query (case-insensitive substring match)
3. When user toggles sort order, chats re-sort by creation time in the selected direction
4. When user clicks a chat, the app navigates to `/chats/:id/messages` and the sidebar closes on mobile
5. When user edits a chat title, the title trims whitespace and rejects empty strings
6. When user clicks "Suggest Title" in the edit dialog, the OpenRouter API generates a title from the chat's messages
7. If the OpenRouter API key is missing or the chat has no messages, the "Suggest Title" button is disabled
8. When user confirms chat deletion, the chat and all its messages are removed and a success toast appears
9. If the deleted chat was the active chat, the app navigates to the home route
10. When IndexedDB contains malformed chat data, the store gracefully falls back to an empty array

## Dependencies

- `messages` - `removeMessagesByChatId` for cascade delete; `$messages` for reading messages during title suggestion
- `settings` - `getSettings` for checking OpenRouter API key availability
- `layout` - `useSidebar` for closing the sidebar on mobile navigation
- `lib/ai` - `generateChatTitle` for AI-powered title suggestion
- External: `wouter` - `useLocation` for navigation between routes
- External: `@legendapp/state` - reactive state with IndexedDB persistence
- External: `zod` - schema validation on store decode
- External: `sonner` - toast notifications for mutation feedback
- External: `lucide-react` - icons (MessageSquare, Pencil, Trash2, PlusCircle, ArrowDownUp, Sparkles)

## Known Gaps

- No pagination; all chats load at once, which may degrade performance at scale
- Search only matches titles, not message content
- AI title suggestion uses the OpenRouter provider; model selection is shared with settings
- Delete is permanent with no undo, soft-delete, or trash
- No bulk operations (select multiple, delete all, export)
- No archive or pin functionality
- Message cascade delete and chat removal are not transactional; a failure between the two could leave orphaned data
- Query hooks use `as ChatType` casts instead of runtime validation on read
- No cross-tab synchronization; each tab hydrates from IndexedDB once on load and writes independently, so changes in one tab are not reflected in another

## Files

| File                                | Purpose                                           |
| ----------------------------------- | ------------------------------------------------- |
| `types/chat.ts`                     | Zod schemas and TypeScript types for chat entity  |
| `store/chat.ts`                     | Persistent atom store with CRUD operations        |
| `hooks/use-query-chats.ts`          | Read hook for all chats                           |
| `hooks/use-query-chat.ts`           | Read hook for a single chat by ID                 |
| `hooks/use-mutation-chats.ts`       | Write hook for creating chats                     |
| `hooks/use-mutation-chat.ts`        | Write hook for editing and deleting a single chat |
| `pages/list-chats-page.tsx`         | Chat list page with search, sort, and new chat    |
| `components/chat-list.tsx`          | Grouped chat list with date sections and actions  |
| `components/add-chat-dialog.tsx`    | Dialog for creating a new chat                    |
| `components/edit-chat-dialog.tsx`   | Dialog for renaming with AI title suggestion      |
| `components/delete-chat-dialog.tsx` | Confirmation dialog for chat deletion             |
