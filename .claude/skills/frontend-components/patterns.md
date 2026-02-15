# Common Component Patterns

Real patterns from this codebase.

## Page Component

Pages are thin. They wire hooks to components and handle navigation. They should not contain rendering logic:

```typescript
// src/chats/pages/add-chat-page.tsx

import type { CreateChatType } from "@/chats/types/chat";
import { $router } from "@/chats/store/router";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";
import AddChatForm from "@/chats/components/add-chat-form";

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

export default AddChatPage;
```

**Key points:**

- Pages call hooks and pass callbacks to components
- Navigation logic lives in the page, not the component
- Default export (pages are the entry point for routes)

## Form Component

Forms use controlled inputs with `useState`. No form library — keep it simple:

```typescript
// src/chats/components/add-chat-form.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CreateChatType } from "@/chats/types/chat";

interface AddChatFormProps {
  onSubmit: (values: CreateChatType) => void;
  onCancel: () => void;
}

const AddChatForm: React.FC<AddChatFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chat title"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!title.trim()}>
          Create Chat
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddChatForm;
```

**Key points:**

- `onSubmit` and `onCancel` come from the parent page — the form doesn't know about routing or stores
- Trim input before submitting
- Disable submit button when input is empty
- Use `e.preventDefault()` on form submit

## List Component

Lists render arrays of items. Handle the empty state inline:

```typescript
// src/chats/components/chat-list.tsx

import { useStore } from "@nanostores/react";
import { cn } from "@/lib/utils";
import { $chats } from "@/chats/store/chat";
import { $router } from "@/chats/store/router";

interface ChatListProps {
  activeChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ activeChatId }) => {
  const chats = useStore($chats);

  if (chats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No chats yet. Create one to get started!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {chats.map((chat) => (
        <li key={chat._id}>
          <button
            onClick={() => $router.open(`/chats/${chat._id}/messages`)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm truncate",
              "hover:bg-secondary",
              chat._id === activeChatId && "bg-secondary font-medium",
            )}
          >
            {chat.title}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
```

**Key points:**

- Empty state returned early as a simple `<p>` with `text-muted-foreground`
- `key={item._id}` on list items
- Active item highlighted with `cn()` conditional class
- `truncate` on text that might overflow

## Message Bubble

A presentational component that renders differently based on data:

```typescript
// src/messages/components/message.tsx

import { cn } from "@/lib/utils";
import type { MessageType } from "@/messages/types/message";

interface MessageProps {
  message: MessageType;
  onDelete?: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onDelete }) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        <p>{message.content}</p>
        {onDelete && (
          <button
            onClick={() => onDelete(message._id)}
            className={cn(
              "text-xs mt-1 underline opacity-60 hover:opacity-100",
              isUser ? "text-primary-foreground" : "text-secondary-foreground",
            )}
          >
            delete
          </button>
        )}
      </div>
    </div>
  );
};

export default Message;
```

**Key points:**

- Uses CSS variables (`bg-primary`, `bg-secondary`) so it works in both light and dark mode
- `cn()` for conditional alignment and color based on `role`
- Optional callback (`onDelete?`) — component renders differently when callback is provided
- `whitespace-pre-wrap` preserves line breaks in message content

## Scrollable List with Auto-Scroll

When a list should auto-scroll to the bottom on new items (e.g., messages):

```typescript
// src/messages/components/message-list.tsx

import { useRef, useEffect } from "react";
import type { MessageType } from "@/messages/types/message";
import Message from "./message";

interface MessageListProps {
  messages: MessageType[];
  onDelete?: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onDelete }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {messages.map((message) => (
        <Message key={message._id} message={message} onDelete={onDelete} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
```

**Key points:**

- Invisible `<div ref={bottomRef} />` at the end of the list
- `useEffect` scrolls to it whenever `messages` changes
- `overflow-y-auto h-full` makes the container scrollable within its parent

## Input with Action

A text input with a submit action and optional mode toggle:

```typescript
// src/messages/components/message-input.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, role: "user" | "assistant") => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [content, setContent] = useState("");
  const [role, setRole] = useState<"user" | "assistant">("user");

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, role);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRole(role === "user" ? "assistant" : "user")}
        className="shrink-0 text-xs"
      >
        {role === "user" ? "User" : "Assistant"}
      </Button>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button type="button" size="icon" onClick={handleSend} disabled={!content.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;
```

**Key points:**

- Enter sends, Shift+Enter for newlines
- Content clears after send, role persists
- Disable send button when input is empty
- `shrink-0` on the role toggle prevents it from shrinking in flex layout

## Composite Page

A page that composes multiple components into a full view:

```typescript
// src/messages/pages/messages-page.tsx

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { $router } from "@/chats/store/router";
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { useQueryMessages } from "@/messages/hooks/use-query-messages";
import { useMutationMessages } from "@/messages/hooks/use-mutation-messages";
import { removeMessage } from "@/messages/store/message";
import MessageList from "@/messages/components/message-list";
import MessageInput from "@/messages/components/message-input";

interface MessagesPageProps {
  chatId: string;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ chatId }) => {
  const { data: chat } = useQueryChat(chatId);
  const { data: messages } = useQueryMessages(chatId);
  const { add: createMessage } = useMutationMessages();

  const handleSend = async (content: string, role: "user" | "assistant") => {
    await createMessage({ chatId, role, content });
  };

  const handleDelete = (messageId: string) => {
    removeMessage(messageId);
  };

  if (!chat) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Chat not found.</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold truncate">{chat.title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => $router.open(`/chats/${chatId}`)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} onDelete={handleDelete} />
      </div>
      <div className="flex-none">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default MessagesPage;
```

**Key points:**

- Three-zone layout: header (`border-b`), body (`flex-1 overflow-y-auto`), footer (`flex-none`)
- Not-found guard at the top
- Page wires hooks to components — components are reusable, pages are specific
