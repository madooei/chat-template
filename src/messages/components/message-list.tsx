import { MessageSquare, Search } from "lucide-react";
import { MessageContent } from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import { ResearchProgress } from "./research-progress";
import type { MessageType } from "@/messages/types/message";
import type { ResearchPhase, ToolEvent } from "@/messages/types/research";
import Message from "./message";

const DIRECT_SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a short poem about the ocean",
  "What are the best practices for React?",
  "Help me plan a weekend trip",
];

const RESEARCH_SUGGESTIONS = [
  "What are the latest developments in AI regulation?",
  "Compare the top JavaScript frameworks in 2025",
  "What is the current state of quantum computing research?",
  "Summarize recent findings on climate change mitigation",
];

interface MessageListProps {
  messages: MessageType[];
  streamingContent?: string;
  isStreaming?: boolean;
  onInsertSuggestion?: (content: string) => void;
  agentType?: "direct" | "mastra";
  researchPhase?: ResearchPhase;
  toolEvents?: ToolEvent[];
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingContent,
  isStreaming,
  onInsertSuggestion,
  agentType = "direct",
  researchPhase,
  toolEvents,
}) => {
  const isResearch = agentType === "mastra";
  const suggestions = isResearch ? RESEARCH_SUGGESTIONS : DIRECT_SUGGESTIONS;
  const EmptyIcon = isResearch ? Search : MessageSquare;
  const emptyTitle = isResearch
    ? "What would you like to research?"
    : "How can I help you today?";

  const isThinking =
    isStreaming &&
    !streamingContent &&
    (!researchPhase || researchPhase === "idle");
  const isWaitingForReport = researchPhase === "reporting" && !streamingContent;

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
        <div className="flex flex-col items-center gap-2">
          <EmptyIcon className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">{emptyTitle}</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {suggestions.map((suggestion) => (
            <PromptSuggestion
              key={suggestion}
              onClick={() => onInsertSuggestion?.(suggestion)}
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
      {researchPhase && researchPhase !== "idle" && (
        <ResearchProgress phase={researchPhase} toolEvents={toolEvents ?? []} />
      )}
      {isThinking && (
        <div className="px-4 py-3">
          <Loader variant="text-shimmer" size="sm" text="Thinking" />
        </div>
      )}
      {isWaitingForReport && (
        <div className="px-4 py-3">
          <Loader variant="text-shimmer" size="sm" text="Writing report" />
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
