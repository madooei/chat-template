import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getSettings } from "@/settings/store/settings";
import { addMessage } from "@/messages/store/message";
import { $messages } from "@/messages/store/message";
import { $chats, updateChat } from "@/chats/store/chat";
import { streamChat, generateChatTitle } from "@/lib/ai";

export function useChat(chatId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const settings = getSettings();

      if (!settings.geminiApiKey) {
        toast.error("API key not configured", {
          description: "Add your Gemini API key in Settings",
        });
        return;
      }

      addMessage({
        _id: crypto.randomUUID(),
        chatId,
        role: "user",
        content,
        _creationTime: Date.now(),
      });

      const history = $messages
        .get()
        .filter((m) => m.chatId === chatId)
        .map((m) => ({ role: m.role, content: m.content }));

      setIsStreaming(true);
      setStreamingContent("");
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await streamChat({
        apiKey: settings.geminiApiKey,
        messages: history,
        abortSignal: abortController.signal,
        onChunk: (accumulated) => {
          setStreamingContent(accumulated);
        },
        onFinish: (fullText) => {
          addMessage({
            _id: crypto.randomUUID(),
            chatId,
            role: "assistant",
            content: fullText,
            _creationTime: Date.now(),
          });
          setStreamingContent("");
          setIsStreaming(false);
          abortControllerRef.current = null;

          const chat = $chats.get().find((c) => c._id === chatId);
          if (chat && chat.title === "New Chat") {
            const allMessages = $messages
              .get()
              .filter((m) => m.chatId === chatId)
              .map((m) => ({ role: m.role, content: m.content }));

            generateChatTitle({
              apiKey: settings.geminiApiKey,
              messages: allMessages,
            }).then((title) => {
              if (title) {
                updateChat({ ...chat, title });
              }
            });
          }
        },
        onError: (err) => {
          setError(err);
          setStreamingContent("");
          setIsStreaming(false);
          abortControllerRef.current = null;
          toast.error("Failed to get response", {
            description: err.message,
          });
        },
      });
    },
    [chatId],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreamingContent("");
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, streamingContent, error, abort };
}
