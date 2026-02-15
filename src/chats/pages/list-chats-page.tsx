import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { $router } from "@/app/router";
import ChatList from "@/chats/components/chat-list";

interface ListChatsPageProps {
  activeChatId?: string;
}

const ListChatsPage: React.FC<ListChatsPageProps> = ({ activeChatId }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-1 md:p-2 lg:p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Chats</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => $router.open("/chats/new")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-1 md:p-2 lg:p-4 overflow-auto">
        <ChatList activeChatId={activeChatId} />
      </div>
    </div>
  );
};

export default ListChatsPage;
