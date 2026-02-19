import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getSettings } from "@/settings/store/settings";
import { addMessage } from "@/messages/store/message";
import { $messages } from "@/messages/store/message";
import { $chats, updateChat } from "@/chats/store/chat";
import {
  streamChat,
  streamMastraChat,
  generateChatTitle,
  getMastraEndpoint,
} from "@/lib/ai";
import { getAgentConfig } from "@/config/agents";

function friendlyErrorMessage(err: Error): string {
  const msg = err.message.toLowerCase();
  if (
    msg.includes("api key") ||
    msg.includes("api_key") ||
    msg.includes("unauthorized") ||
    msg.includes("401")
  ) {
    return "Your API key is invalid. Please check it in Settings.";
  }
  if (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("429")
  ) {
    return "You've hit the API rate limit. Please wait a moment and try again.";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("econnrefused")
  ) {
    return "Network error. Check your internet connection and try again.";
  }
  if (msg.includes("mastra")) {
    return "Could not reach the Mastra server. Make sure it is running.";
  }
  return "Something went wrong. Please try again.";
}

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
    async (content: string, model: string): Promise<boolean> => {
      const settings = getSettings();
      const chat = $chats.get().find((c) => c._id === chatId);
      const agentConfig = getAgentConfig(chat?.agentId);

      // Only require API key for direct chats
      if (agentConfig.type === "direct" && !settings.openRouterApiKey) {
        toast.error("API key not configured", {
          description: "Add your OpenRouter API key in Settings",
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

      const onChunk = (accumulated: string) => {
        if (requestIdRef.current !== requestId) return;
        setStreamingContent(accumulated);
      };

      const onFinish = (fullText: string) => {
        if (requestIdRef.current !== requestId) return;

        const latestChat = $chats.get().find((c) => c._id === chatId);
        if (!latestChat) {
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

        // Auto-generate title for new chats
        if (
          latestChat.title === "New Chat" ||
          latestChat.title === "New Research"
        ) {
          if (settings.openRouterApiKey) {
            const allMessages = $messages
              .get()
              .filter((m) => m.chatId === chatId)
              .map((m) => ({ role: m.role, content: m.content }));

            generateChatTitle({
              apiKey: settings.openRouterApiKey,
              model,
              messages: allMessages,
            }).then((title) => {
              if (requestIdRef.current !== requestId || !title) return;
              const currentChat = $chats.get().find((c) => c._id === chatId);
              if (currentChat) {
                updateChat({ ...currentChat, title });
              }
            });
          } else {
            // Fallback: use first few words of user message as title
            const words = content.split(/\s+/).slice(0, 6).join(" ");
            const fallbackTitle =
              words.length > 40 ? words.slice(0, 40) + "..." : words;
            updateChat({ ...latestChat, title: fallbackTitle });
          }
        }
      };

      const onError = (err: Error) => {
        if (requestIdRef.current !== requestId) return;
        setError(err);
        setStreamingContent("");
        setIsStreaming(false);
        abortControllerRef.current = null;
        console.error("[useChat] streaming failed:", err);
        const friendly = friendlyErrorMessage(err);
        toast.error(friendly, { duration: 8000 });
      };

      if (agentConfig.type === "mastra" && agentConfig.mastraAgentId) {
        void streamMastraChat({
          endpoint: getMastraEndpoint(),
          agentId: agentConfig.mastraAgentId,
          messages: history,
          abortSignal: abortController.signal,
          onChunk,
          onFinish,
          onError,
        });
      } else {
        void streamChat({
          apiKey: settings.openRouterApiKey,
          model,
          messages: history,
          abortSignal: abortController.signal,
          onChunk,
          onFinish,
          onError,
        });
      }

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
