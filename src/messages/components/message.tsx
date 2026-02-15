import { useState } from "react";
import { BotMessageSquare, Check, Copy, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Markdown from "@/components/markdown-preview";
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
      className="flex gap-3 px-4 py-2 group hover:bg-accent/50 transition-colors"
      role="listitem"
    >
      <div className="flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          {isAssistant ? (
            <BotMessageSquare className="h-5 w-5 text-primary" />
          ) : (
            <User2 className="h-5 w-5 text-secondary-foreground" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm">
              {isAssistant ? "Assistant" : "You"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 transition-colors", {
                "text-primary": copied,
              })}
              aria-label={copied ? "Copied" : "Copy message"}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-0.5 text-foreground">
          {isAssistant ? (
            <Markdown content={message.content} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
