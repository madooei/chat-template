import { toast } from "sonner";
import { ChevronDown, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { useQueryMessages } from "@/messages/hooks/use-query-messages";
import { useChat } from "@/messages/hooks/use-chat";
import MessageList from "@/messages/components/message-list";
import MessageInput from "@/messages/components/message-input";

const MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", active: true },
  { id: "gpt-4o", label: "GPT-4o", active: false },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", active: false },
];

interface MessagesPageProps {
  chatId: string;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ chatId }) => {
  const { data: chat } = useQueryChat(chatId);
  const { data: messages } = useQueryMessages(chatId);
  const { sendMessage, isStreaming, streamingContent, abort } = useChat(chatId);

  const handleSend = (content: string) => {
    sendMessage(content);
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
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {MODELS.find((m) => m.active)?.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => {
                    if (!model.active) {
                      toast.info("Model switching is not implemented yet");
                    }
                  }}
                >
                  {model.label}
                  {model.active && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      active
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Export chat"
            onClick={() => toast.info("Export is not implemented yet")}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ChatContainerRoot className="relative flex-1">
        <ChatContainerContent className="mx-auto w-full max-w-3xl py-3">
          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            onSendSuggestion={handleSend}
          />
        </ChatContainerContent>
        <ChatContainerScrollAnchor />
        <div className="absolute bottom-0 left-0 z-10 flex w-full justify-center pointer-events-none">
          <ScrollButton className="mb-2 pointer-events-auto" />
        </div>
      </ChatContainerRoot>
      <MessageInput
        onSend={handleSend}
        isLoading={isStreaming}
        onAbort={abort}
      />
    </div>
  );
};

export default MessagesPage;
