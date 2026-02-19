import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Share } from "lucide-react";
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
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/config/models";

interface MessagesPageProps {
  chatId: string;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ chatId }) => {
  const { data: chat } = useQueryChat(chatId);
  const { data: messages } = useQueryMessages(chatId);
  const {
    sendMessage,
    isStreaming,
    streamingContent,
    abort,
    researchPhase,
    toolEvents,
  } = useChat(chatId);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [inputValue, setInputValue] = useState("");
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [, setLocation] = useLocation();

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === model);

  const handleSend = async (content: string) => {
    const accepted = await sendMessage(content, model, researchEnabled);
    if (accepted) {
      setInputValue("");
    }
  };

  if (!chat) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Chat not found.</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 flex-shrink-0"
            onClick={() => setLocation("/")}
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold truncate">{chat.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {activeModel?.label ?? model}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {AVAILABLE_MODELS.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => setModel(m.id)}>
                  {m.label}
                  {m.id === model && (
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
      <ChatContainerRoot className="relative flex-1" aria-label="Chat messages">
        <ChatContainerContent className="mx-auto w-full max-w-3xl py-3">
          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            onInsertSuggestion={setInputValue}
            researchPhase={researchPhase}
            toolEvents={toolEvents}
          />
        </ChatContainerContent>
        <ChatContainerScrollAnchor />
        <div className="absolute bottom-0 left-0 z-10 flex w-full justify-center pointer-events-none">
          <ScrollButton className="mb-2 pointer-events-auto" />
        </div>
      </ChatContainerRoot>
      <MessageInput
        value={inputValue}
        onValueChange={setInputValue}
        onSend={handleSend}
        isLoading={isStreaming}
        onAbort={abort}
        researchEnabled={researchEnabled}
        onResearchToggle={() => setResearchEnabled((prev) => !prev)}
      />
    </div>
  );
};

export default MessagesPage;
