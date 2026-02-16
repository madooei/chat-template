import { useState, useRef, useCallback, useEffect } from "react";
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      // Invalidate any pending callbacks for the current request and cancel it.
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const settings = getSettings();

      if (!settings.geminiApiKey) {
        toast.error("API key not configured", {
          description: "Add your Gemini API key in Settings",
        });
        return false;
      }

      // If a previous request is still streaming, stop it before starting a new one.
      if (abortControllerRef.current) {
        requestIdRef.current += 1;
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
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

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      void streamChat({
        apiKey: settings.geminiApiKey,
        messages: history,
        abortSignal: abortController.signal,
        onChunk: (accumulated) => {
          if (requestIdRef.current !== requestId) return;
          setStreamingContent(accumulated);
        },
        onFinish: (fullText) => {
          if (requestIdRef.current !== requestId) return;

          const chat = $chats.get().find((c) => c._id === chatId);
          if (!chat) {
            setStreamingContent("");
            setIsStreaming(false);
            abortControllerRef.current = null;
            return;
          }

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

          if (chat.title === "New Chat") {
            const allMessages = $messages
              .get()
              .filter((m) => m.chatId === chatId)
              .map((m) => ({ role: m.role, content: m.content }));

            generateChatTitle({
              apiKey: settings.geminiApiKey,
              messages: allMessages,
            }).then((title) => {
              if (requestIdRef.current !== requestId || !title) return;

              const latestChat = $chats.get().find((c) => c._id === chatId);
              if (latestChat) {
                updateChat({ ...latestChat, title });
              }
            });
          }
        },
        onError: (err) => {
          if (requestIdRef.current !== requestId) return;
          setError(err);
          setStreamingContent("");
          setIsStreaming(false);
          abortControllerRef.current = null;
          toast.error("Failed to get response", {
            description: err.message,
          });
        },
      });

      return true;
    },
    [chatId],
  );

  const abort = useCallback(() => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreamingContent("");
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, streamingContent, error, abort };
}
