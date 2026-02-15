import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onAbort?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled,
  isStreaming,
  onAbort,
}) => {
  const [content, setContent] = useState("");

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
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
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      />
      {isStreaming ? (
        <Button type="button" size="icon" variant="destructive" onClick={onAbort}>
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default MessageInput;
