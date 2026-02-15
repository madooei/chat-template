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
