import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";

interface AddChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddChatDialog: React.FC<AddChatDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [title, setTitle] = useState("");
  const [, setLocation] = useLocation();
  const { add: createChat } = useMutationChats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const chatId = await createChat({ title: trimmed });
    if (chatId) {
      setTitle("");
      onOpenChange(false);
      setLocation(`/chats/${chatId}/messages`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
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
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
