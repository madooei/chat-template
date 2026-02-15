# Feature Directory Structure

## The Pipeline

Every feature follows the same layered pipeline. Each layer depends only on the layers before it:

```plaintext
types/  →  store/  →  hooks/  →  components/  →  pages/
```

- **Types** define the shape of data (Zod schemas, TypeScript types)
- **Store** manages that data (nanostores atoms, CRUD functions)
- **Hooks** expose the store to React (thin adapters like `useQueryChats`)
- **Components** render UI using hooks (no direct store access)
- **Pages** compose components into full views (thin wrappers)

This pipeline creates a clean abstraction boundary. When you later swap localStorage for a real backend, you change the store layer and nothing above it breaks.

## Standard Subdirectories

| Directory     | Purpose               | When to Create                          |
| ------------- | --------------------- | --------------------------------------- |
| `types/`      | Zod schemas and types | Almost always — defines the data shape  |
| `store/`      | Nanostores state      | When the feature manages its own state  |
| `hooks/`      | Custom React hooks    | When components need data or logic      |
| `components/` | React components      | Always — features need UI               |
| `pages/`      | Route page components | When the feature has navigable views    |
| `lib/`        | Utilities, helpers    | When you need pure functions, constants |

Create only what you need. A simple feature might only have `components/` and `hooks/`. A data-driven feature will have all five core directories.

## Example: Chats Feature

The chats feature manages chat CRUD with full pipeline:

```plaintext
chats/
├── types/
│   └── chat.ts                # Zod schemas + ChatType
├── store/
│   ├── chat.ts                # $chats atom + CRUD functions
│   └── router.ts              # App-wide route definitions
├── hooks/
│   ├── use-query-chats.ts     # List all chats
│   ├── use-query-chat.ts      # Get single chat by ID
│   ├── use-mutation-chats.ts  # Create chat
│   └── use-mutation-chat.ts   # Update/delete chat
├── components/
│   ├── chat-list.tsx           # Renders list of chats
│   ├── add-chat-form.tsx       # Form for creating
│   └── edit-chat-form.tsx      # Form for editing
└── pages/
    ├── list-chats-page.tsx     # Chat list + new chat button
    ├── add-chat-page.tsx       # Create chat page
    └── edit-chat-page.tsx      # Edit chat page
```

**Key patterns:**

- One Zod schema file defines `createChatSchema`, `updateChatSchema`, `chatSchema`, and their inferred types
- Store has CRUD functions (`addChat`, `updateChat`, `removeChat`, `clearChats`)
- Hooks split into query (read) and mutation (write) — singular vs plural naming distinguishes "one item" from "collection"
- Pages are thin wrappers that wire hooks to components

## Example: Messages Feature

The messages feature follows the same pattern:

```plaintext
messages/
├── types/
│   └── message.ts             # Zod schemas + MessageType
├── store/
│   └── message.ts             # $messages atom + CRUD functions
├── hooks/
│   ├── use-query-messages.ts  # List messages by chatId
│   ├── use-query-message.ts   # Get single message by ID
│   ├── use-mutation-messages.ts # Create message
│   └── use-mutation-message.ts  # Update/delete message
├── components/
│   ├── message.tsx            # Single message bubble
│   ├── message-list.tsx       # Scrollable message list
│   └── message-input.tsx      # Textarea + send button
└── pages/
    └── messages-page.tsx      # Full messages view
```

**Key patterns:**

- Same pipeline as chats — consistent structure makes features predictable
- `removeMessagesByChatId` in the store enables cascade deletes from the chats feature
- Components are small and focused: one bubble, one list, one input

## File Naming Conventions

| Type       | Convention            | Example              |
| ---------- | --------------------- | -------------------- |
| Components | kebab-case `.tsx`     | `chat-list.tsx`      |
| Hooks      | `use-` prefix `.ts`   | `use-query-chats.ts` |
| Types      | kebab-case `.ts`      | `chat.ts`            |
| Stores     | feature name `.ts`    | `chat.ts`            |
| Pages      | `-page` suffix `.tsx` | `edit-chat-page.tsx` |
| Utilities  | kebab-case `.ts`      | `utils.ts`           |

## Hook Naming Convention

Hooks follow a `use-{action}-{resource}` pattern:

- **Query hooks** — `use-query-{resource}` for reading data
  - Plural resource = collection: `use-query-chats` (returns list)
  - Singular resource = single item: `use-query-chat` (takes an ID, returns one)
- **Mutation hooks** — `use-mutation-{resource}` for writing data
  - Plural resource = collection-level: `use-mutation-chats` (create)
  - Singular resource = item-level: `use-mutation-chat` (update, delete)

## Page Components

Pages are thin. They wire hooks to components and handle navigation. They should not contain complex logic:

```typescript
// pages/add-chat-page.tsx — thin wrapper
const AddChatPage: React.FC = () => {
  const { add: createChat } = useMutationChats();

  const handleSubmit = async (values: CreateChatType) => {
    const chatId = await createChat(values);
    if (chatId) {
      $router.open(`/chats/${chatId}/messages`);
    }
  };

  const handleCancel = () => {
    $router.open("/");
  };

  return (
    <div className="p-1 md:p-2 lg:p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Chat</h2>
      </div>
      <AddChatForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
};
```

## No Root Barrel Files

Do NOT create `index.ts` at the feature root:

```plaintext
chats/
├── index.ts        ← Don't create this
├── components/
├── hooks/
└── types/
```

Always import directly from the specific file you need. This keeps dependencies explicit and makes it easy to trace where things come from.
