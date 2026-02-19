import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowDownUp, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatList from "@/chats/components/chat-list";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";

interface ListChatsPageProps {
  activeChatId?: string;
}

const ListChatsPage: React.FC<ListChatsPageProps> = ({ activeChatId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [, setLocation] = useLocation();
  const { add: createChat } = useMutationChats();

  const handleNewChat = async () => {
    const chatId = await createChat({ title: "New Chat" });
    if (chatId) {
      setLocation(`/chats/${chatId}/messages`);
    }
  };

  const handleNewResearch = async () => {
    const chatId = await createChat({
      title: "New Research",
      agentId: "deep-research",
    });
    if (chatId) {
      setLocation(`/chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-3 md:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Chats</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewResearch}>
              <Search className="mr-2 h-4 w-4" />
              Research
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            aria-label={
              sortOrder === "desc" ? "Sort oldest first" : "Sort newest first"
            }
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-3 md:p-4 overflow-auto">
        <ChatList
          activeChatId={activeChatId}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
        />
      </div>
    </div>
  );
};

export default ListChatsPage;
