import { MessageSquare } from "lucide-react";
import { MessageContent } from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import type { MessageType } from "@/messages/types/message";
import Message from "./message";

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a short poem about the ocean",
  "What are the best practices for React?",
  "Help me plan a weekend trip",
];

interface MessageListProps {
  messages: MessageType[];
  streamingContent?: string;
  isStreaming?: boolean;
  onSendSuggestion?: (content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingContent,
  isStreaming,
  onSendSuggestion,
}) => {
  const isThinking = isStreaming && !streamingContent;

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
        <div className="flex flex-col items-center gap-2">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">
            How can I help you today?
          </h3>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {SUGGESTIONS.map((suggestion) => (
            <PromptSuggestion
              key={suggestion}
              onClick={() => onSendSuggestion?.(suggestion)}
            >
              {suggestion}
            </PromptSuggestion>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <Message key={message._id} message={message} />
      ))}
      {isThinking && (
        <div className="px-4 py-3">
          <Loader variant="text-shimmer" size="sm" text="Thinking" />
        </div>
      )}
      {streamingContent && (
        <div className="flex flex-col gap-1 px-4 py-3">
          <MessageContent
            markdown
            className="bg-transparent p-0 rounded-none prose prose-neutral prose-sm dark:prose-invert max-w-full sm:max-w-[85%]"
          >
            {streamingContent}
          </MessageContent>
        </div>
      )}
    </>
  );
};

export default MessageList;
