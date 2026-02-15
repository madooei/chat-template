import { useStore } from "@nanostores/react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { $chats } from "@/chats/store/chat";
import { $router } from "@/app/router";

interface ChatListProps {
  activeChatId?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const ChatList: React.FC<ChatListProps> = ({ activeChatId }) => {
  const chats = useStore($chats);

  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          No chats yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col" role="list">
      {chats.map((chat) => {
        const isActive = chat._id === activeChatId;

        return (
          <li key={chat._id} className="border-b last:border-b-0">
            <button
              onClick={() => $router.open(`/chats/${chat._id}/messages`)}
              className={cn(
                "w-full text-left px-3 py-3 flex items-start gap-3 transition-colors",
                "hover:bg-accent",
                isActive && "bg-secondary border-l-2 border-l-primary",
              )}
            >
              <MessageSquare
                className={cn(
                  "h-4 w-4 mt-0.5 flex-shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm truncate",
                    isActive && "font-medium",
                  )}
                >
                  {chat.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(chat._creationTime)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ChatList;
