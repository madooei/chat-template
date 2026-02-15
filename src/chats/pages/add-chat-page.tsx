import type { CreateChatType } from "@/chats/types/chat";
import { $router } from "@/app/router";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";
import AddChatForm from "@/chats/components/add-chat-form";

const AddChatPage: React.FC = () => {
  const { add: createChat } = useMutationChats();

  const handleSubmit = async (values: CreateChatType) => {
    const chatId = await createChat(values);
    if (chatId) {
      $router.open(`/chats/${chatId}/messages`);
    }
  };

  const handleCancel = () => {
    $router.open("/");
  };

  return (
    <div className="p-1 md:p-2 lg:p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Chat</h2>
      </div>
      <AddChatForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
};

export default AddChatPage;
