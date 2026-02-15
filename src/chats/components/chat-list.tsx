import { useStore } from "@nanostores/react";
import { cn } from "@/lib/utils";
import { $chats } from "@/chats/store/chat";
import { $router } from "@/app/router";

interface ChatListProps {
  activeChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ activeChatId }) => {
  const chats = useStore($chats);

  if (chats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No chats yet. Create one to get started!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {chats.map((chat) => (
        <li key={chat._id}>
          <button
            onClick={() => $router.open(`/chats/${chat._id}/messages`)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm truncate",
              "hover:bg-secondary",
              chat._id === activeChatId && "bg-secondary font-medium",
            )}
          >
            {chat.title}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
