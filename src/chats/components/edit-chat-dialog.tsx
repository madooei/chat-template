import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
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
import { $messages } from "@/messages/store/message";
import { getSettings } from "@/settings/store/settings";
import { generateChatTitle } from "@/lib/ai";
import { DEFAULT_MODEL } from "@/config/models";

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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { edit: editChat } = useMutationChat(chat._id);

  const settings = getSettings();
  const chatMessages = $messages.get().filter((m) => m.chatId === chat._id);
  const canSuggest = chatMessages.length > 0 && !!settings.openRouterApiKey;

  const handleSuggestTitle = async () => {
    setIsSuggesting(true);
    const messages = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const suggested = await generateChatTitle({
      apiKey: settings.openRouterApiKey,
      model: DEFAULT_MODEL,
      messages,
    });
    if (suggested) {
      setTitle(suggested);
    }
    setIsSuggesting(false);
  };

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
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chat title"
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canSuggest || isSuggesting}
              onClick={handleSuggestTitle}
              title="Suggest title"
            >
              {isSuggesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
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
