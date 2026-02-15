import { useCallback, useEffect, useRef, useState } from "react";
import { BotMessageSquare } from "lucide-react";
import Markdown from "@/components/markdown-preview";
import type { MessageType } from "@/messages/types/message";
import Message from "./message";

const STREAMING_MESSAGE_ID = "streaming-message";
const THINKING_MESSAGE_ID = "thinking-message";

interface MessageListProps {
  messages: MessageType[];
  streamingContent?: string;
  isStreaming?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingContent,
  isStreaming,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstMessageId = useRef<string | null>(null);
  const lastMessageId = useRef<string | null>(null);
  const scrollTopValue = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollDirection, setScrollDirection] = useState<
    "down" | "up" | null
  >(null);

  const isThinking = isStreaming && !streamingContent;

  const scrollToMessage = useCallback(
    (
      messageId: string | null,
      block: "start" | "center" | "end" | "nearest" = "end",
    ) => {
      if (!messageId) return;
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block, inline: "nearest" });
      }
    },
    [],
  );

  useEffect(
    () => {
      if (messages.length <= 0) return;

      // Determine the effective last message ID based on priority:
      // streaming content > thinking indicator > last real message
      const effectiveLastId = streamingContent
        ? STREAMING_MESSAGE_ID
        : isThinking
          ? THINKING_MESSAGE_ID
          : messages[messages.length - 1]._id;

      // First render — store IDs and scroll to bottom
      if (!lastMessageId.current || !firstMessageId.current) {
        lastMessageId.current = effectiveLastId;
        firstMessageId.current = messages[0]._id;
        scrollToMessage(lastMessageId.current);
        return;
      }

      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      if (effectiveLastId !== lastMessageId.current) {
        // New message at the bottom — scroll down
        lastMessageId.current = effectiveLastId;
        scrollToMessage(lastMessageId.current);
      } else if (firstMessage._id !== firstMessageId.current) {
        // Older messages loaded at top — keep current view position
        const oldFirstId = firstMessageId.current;
        firstMessageId.current = firstMessage._id;
        scrollToMessage(oldFirstId, "center");
      } else {
        // Content update on the last message (e.g. streaming) —
        // only auto-scroll if the user hasn't scrolled up
        if (!isUserScrolling.current && scrollDirection !== "up") {
          scrollToMessage(lastMessageId.current);
        }
      }
    },
    // Intentionally excluding isUserScrolling and scrollDirection
    [messages, scrollToMessage, streamingContent, isThinking],
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    isUserScrolling.current = true;

    if (scrollTopValue.current < e.currentTarget.scrollTop) {
      setScrollDirection("down");
    } else {
      setScrollDirection("up");
    }

    scrollTopValue.current = e.currentTarget.scrollTop;

    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);
  };

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto scroll-smooth"
      onScroll={handleScroll}
    >
      <div className="flex flex-col py-3">
        {messages.map((message) => (
          <div key={message._id} data-message-id={message._id}>
            <Message message={message} />
          </div>
        ))}
        {isThinking && (
          <div data-message-id={THINKING_MESSAGE_ID}>
            <div className="flex gap-3 px-4 py-2">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <BotMessageSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {streamingContent && (
          <div data-message-id={STREAMING_MESSAGE_ID}>
            <div className="flex gap-3 px-4 py-2">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <BotMessageSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">
                    Assistant
                  </span>
                </div>
                <div className="mt-0.5 text-foreground">
                  <Markdown content={streamingContent} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
