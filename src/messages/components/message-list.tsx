import { useRef, useEffect } from "react";
import type { MessageType } from "@/messages/types/message";
import Message from "./message";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {messages.map((message) => (
        <Message key={message._id} message={message} />
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-secondary text-secondary-foreground">
            {streamingContent ? (
              <p>{streamingContent}</p>
            ) : (
              <div className="flex items-center gap-1">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
