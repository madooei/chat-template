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
import { AVAILABLE_AGENTS, DEFAULT_AGENT } from "@/config/agents";

interface AddChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddChatDialog: React.FC<AddChatDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [title, setTitle] = useState("");
  const [agentId, setAgentId] = useState(DEFAULT_AGENT);
  const [, setLocation] = useLocation();
  const { add: createChat } = useMutationChats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const chatId = await createChat({
      title: trimmed,
      agentId: agentId === DEFAULT_AGENT ? undefined : agentId,
    });
    if (chatId) {
      setTitle("");
      setAgentId(DEFAULT_AGENT);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chat title"
            autoFocus
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Chat Type</label>
            <div className="flex gap-2">
              {AVAILABLE_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setAgentId(agent.id)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    agentId === agent.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="font-medium">{agent.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {agent.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
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
