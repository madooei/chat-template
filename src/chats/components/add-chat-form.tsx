import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CreateChatType } from "@/chats/types/chat";

interface AddChatFormProps {
  onSubmit: (values: CreateChatType) => void;
  onCancel: () => void;
}

const AddChatForm: React.FC<AddChatFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");

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
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!title.trim()}>
          Create Chat
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddChatForm;
