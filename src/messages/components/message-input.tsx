import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, role: "user" | "assistant") => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [content, setContent] = useState("");
  const [role, setRole] = useState<"user" | "assistant">("user");

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, role);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRole(role === "user" ? "assistant" : "user")}
        className="shrink-0 text-xs"
      >
        {role === "user" ? "User" : "Assistant"}
      </Button>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={!content.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;
