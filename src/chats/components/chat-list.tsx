import { useState } from "react";
import { useStore } from "@nanostores/react";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { $chats } from "@/chats/store/chat";
import { $router } from "@/app/router";
import type { ChatType } from "@/chats/types/chat";
import { toast } from "sonner";
import { removeChat } from "@/chats/store/chat";
import { removeMessagesByChatId } from "@/messages/store/message";
import EditChatDialog from "@/chats/components/edit-chat-dialog";
import DeleteChatDialog from "@/chats/components/delete-chat-dialog";

interface ChatListProps {
  activeChatId?: string;
  searchQuery?: string;
  sortOrder?: "desc" | "asc";
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

const ChatList: React.FC<ChatListProps> = ({
  activeChatId,
  searchQuery,
  sortOrder = "desc",
}) => {
  const chats = useStore($chats);
  const [editingChat, setEditingChat] = useState<ChatType | null>(null);

  const handleDelete = (chatId: string) => {
    removeMessagesByChatId(chatId);
    removeChat(chatId);
    toast.success("Chat deleted successfully");
    if (chatId === activeChatId) {
      $router.open("/");
    }
  };

  const filtered = chats
    .filter((chat) =>
      searchQuery
        ? chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    )
    .sort((a, b) =>
      sortOrder === "desc"
        ? b._creationTime - a._creationTime
        : a._creationTime - b._creationTime,
    );

  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          No chats yet. Create one to get started!
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No matching chats.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col" role="list">
        {filtered.map((chat) => {
          const isActive = chat._id === activeChatId;

          return (
            <li key={chat._id} className="border-b last:border-b-0 group">
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
                    isActive ? "text-primary" : "text-muted-foreground",
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
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChat(chat);
                          }}
                          aria-label="Edit chat"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Edit chat</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span onClick={(e) => e.stopPropagation()}>
                          <DeleteChatDialog
                            onDelete={() => handleDelete(chat._id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Delete chat"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete chat</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {editingChat && (
        <EditChatDialog
          chat={editingChat}
          open={!!editingChat}
          onOpenChange={(open) => {
            if (!open) setEditingChat(null);
          }}
        />
      )}
    </>
  );
};

export default ChatList;
