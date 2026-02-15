import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { $router } from "@/app/router";
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { useQueryMessages } from "@/messages/hooks/use-query-messages";
import { useChat } from "@/messages/hooks/use-chat";
import MessageList from "@/messages/components/message-list";
import MessageInput from "@/messages/components/message-input";

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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit chat settings"
          onClick={() => $router.open(`/chats/${chatId}`)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        isStreaming={isStreaming}
        onAbort={abort}
      />
    </div>
  );
};

export default MessagesPage;
