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
import { useSidebar } from "@/layout/sidebar-context";

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

function groupByDate(
  chats: ChatType[],
): { label: string; chats: ChatType[] }[] {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekAgoStart = todayStart - 7 * 86400000;

  const groups: Record<string, ChatType[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const chat of chats) {
    const t = chat._creationTime;
    if (t >= todayStart) {
      groups["Today"].push(chat);
    } else if (t >= yesterdayStart) {
      groups["Yesterday"].push(chat);
    } else if (t >= weekAgoStart) {
      groups["Previous 7 days"].push(chat);
    } else {
      groups["Older"].push(chat);
    }
  }

  return Object.entries(groups)
    .filter(([, chats]) => chats.length > 0)
    .map(([label, chats]) => ({ label, chats }));
}

const ChatList: React.FC<ChatListProps> = ({
  activeChatId,
  searchQuery,
  sortOrder = "desc",
}) => {
  const chats = useStore($chats);
  const [editingChat, setEditingChat] = useState<ChatType | null>(null);
  const { closeSidebar } = useSidebar();

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

  const groups = groupByDate(filtered);

  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h3>
          <ul role="list">
            {group.chats.map((chat) => {
              const isActive = chat._id === activeChatId;

              return (
                <li key={chat._id} className="relative group">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      $router.open(`/chats/${chat._id}/messages`);
                      closeSidebar();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        $router.open(`/chats/${chat._id}/messages`);
                        closeSidebar();
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-3 pr-20 flex items-start gap-3 transition-colors cursor-pointer",
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
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                        </TooltipTrigger>
                        <TooltipContent side="top">Delete chat</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
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
