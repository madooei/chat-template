import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/prompt-kit/prompt-input";
import { Paperclip, Mic, Send, Square } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  onAbort?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  isLoading,
  onAbort,
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setContent("");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto w-full">
      <PromptInput
        value={content}
        onValueChange={setContent}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      >
        <PromptInputTextarea placeholder="Type a message..." autoFocus />
        <PromptInputActions className="justify-between px-2 pt-2">
          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Attach file">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Attach file"
                onClick={() => toast.info("File upload is not implemented yet")}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </PromptInputAction>
            <PromptInputAction tooltip="Voice input">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Voice input"
                onClick={() => toast.info("Voice input is not implemented yet")}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          </div>
          {isLoading ? (
            <PromptInputAction tooltip="Stop generating">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                aria-label="Stop generating"
                onClick={onAbort}
              >
                <Square className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          ) : (
            <PromptInputAction tooltip="Send message">
              <Button
                size="icon"
                className="h-8 w-8"
                aria-label="Send message"
                onClick={handleSubmit}
                disabled={!content.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          )}
        </PromptInputActions>
      </PromptInput>
    </div>
  );
};

export default MessageInput;
