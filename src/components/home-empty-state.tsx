import { useLocation } from "wouter";
import { MessageSquare, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";

const HomeEmptyState: React.FC = () => {
  const [, setLocation] = useLocation();
  const { add: createChat } = useMutationChats();

  const handleNewChat = async () => {
    const chatId = await createChat({ title: "New Chat" });
    if (chatId) {
      setLocation(`/chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Welcome to Chat Template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation to get going.
        </p>
      </div>
      <Button onClick={handleNewChat}>
        <PlusCircle className="mr-2 h-4 w-4" />
        New Chat
      </Button>
    </div>
  );
};

export default HomeEmptyState;
