import type { CreateChatType } from "@/chats/types/chat";
import { $router } from "@/chats/store/router";
import { useQueryChat } from "@/chats/hooks/use-query-chat";
import { useMutationChat } from "@/chats/hooks/use-mutation-chat";
import EditChatForm from "@/chats/components/edit-chat-form";

interface EditChatPageProps {
  chatId: string;
}

const EditChatPage: React.FC<EditChatPageProps> = ({ chatId }) => {
  const { data: chat } = useQueryChat(chatId);
  const { edit: editChat, delete: deleteChat } = useMutationChat(chatId);

  const handleSubmit = async (values: CreateChatType) => {
    const success = await editChat(values);
    if (success) {
      $router.open(`/chats/${chatId}/messages`);
    }
  };

  const handleCancel = () => {
    $router.open(`/chats/${chatId}/messages`);
  };

  const handleDelete = async () => {
    const success = await deleteChat();
    if (success) {
      $router.open("/");
    }
  };

  if (!chat) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Chat not found.</div>
    );
  }

  return (
    <div className="p-1 md:p-2 lg:p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Chat</h2>
      </div>
      <EditChatForm
        chat={chat}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default EditChatPage;
