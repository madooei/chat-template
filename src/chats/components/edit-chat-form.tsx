import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ChatType, CreateChatType } from "@/chats/types/chat";

interface EditChatFormProps {
  chat: ChatType;
  onSubmit: (values: CreateChatType) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const EditChatForm: React.FC<EditChatFormProps> = ({
  chat,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [title, setTitle] = useState(chat.title);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chat title"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center justify-between">
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EditChatForm;
