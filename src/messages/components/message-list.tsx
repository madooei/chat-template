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
