import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/prompt-kit/prompt-input";
import { Paperclip, Mic, Send, Square, Globe } from "lucide-react";

interface MessageInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (content: string) => void | Promise<void>;
  isLoading?: boolean;
  onAbort?: () => void;
  researchEnabled?: boolean;
  onResearchToggle?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onValueChange,
  onSend,
  isLoading,
  onAbort,
  researchEnabled,
  onResearchToggle,
}) => {
  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    void onSend(trimmed);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto w-full">
      <PromptInput
        value={value}
        onValueChange={onValueChange}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      >
        <PromptInputTextarea placeholder="Ask anything..." autoFocus />
        <PromptInputActions className="justify-between px-2 pt-2">
          <div className="flex items-center gap-2">
            <PromptInputAction
              tooltip={researchEnabled ? "Deep Research" : "Deep Research"}
            >
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${researchEnabled ? "bg-primary/10 text-primary" : ""}`}
                aria-label="Deep Research"
                onClick={onResearchToggle}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </PromptInputAction>
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
                disabled={!value.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          )}
        </PromptInputActions>
      </PromptInput>
      <p className="text-xs text-muted-foreground text-center pt-2">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
