import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/messages/types/message";

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex flex-col gap-1 px-4 py-3",
        !isAssistant && "items-end",
      )}
      role="listitem"
    >
      <MessageContent
        markdown
        className={cn(
          "prose prose-neutral prose-sm dark:prose-invert",
          isAssistant
            ? "bg-transparent p-0 rounded-none max-w-full sm:max-w-[85%]"
            : "max-w-full sm:max-w-[80%] px-4",
        )}
      >
        {message.content}
      </MessageContent>

      <MessageActions
        className={cn(
          "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
          !isAssistant && "flex-row-reverse",
        )}
      >
        {!isAssistant && (
          <span className="text-xs text-muted-foreground self-center">
            {new Date(message._creationTime).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        <MessageAction tooltip={copied ? "Copied" : "Copy message"}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={copied ? "Copied" : "Copy message"}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </MessageAction>
        {isAssistant ? (
          <>
            <MessageAction tooltip="Thumbs up">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Thumbs up"
                onClick={() => toast.info("Feedback is not implemented yet")}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
            </MessageAction>
            <MessageAction tooltip="Thumbs down">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Thumbs down"
                onClick={() => toast.info("Feedback is not implemented yet")}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </MessageAction>
            <MessageAction tooltip="Regenerate">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Regenerate"
                onClick={() => toast.info("Regenerate is not implemented yet")}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </MessageAction>
          </>
        ) : (
          <MessageAction tooltip="Edit message">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Edit message"
              onClick={() => toast.info("Edit message is not implemented yet")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </MessageAction>
        )}
      </MessageActions>
    </div>
  );
};

export default Message;
