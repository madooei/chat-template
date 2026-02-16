import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatType } from "@/chats/types/chat";
import { useMutationChat } from "@/chats/hooks/use-mutation-chat";

interface EditChatDialogProps {
  chat: ChatType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditChatDialog: React.FC<EditChatDialogProps> = ({
  chat,
  open,
  onOpenChange,
}) => {
  const [title, setTitle] = useState(chat.title);
  const { edit: editChat } = useMutationChat(chat._id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const success = await editChat({ title: trimmed });
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chat title"
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditChatDialog;
