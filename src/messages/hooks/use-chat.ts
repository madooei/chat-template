import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuthToken } from "@/hooks/use-auth-token";
import { streamChatSSE } from "@/lib/sse";
import { CONVEX_SITE_URL } from "@/lib/convex";

function friendlyErrorMessage(err: Error): string {
  const msg = err.message.toLowerCase();
  if (
    msg.includes("api key") ||
    msg.includes("api_key") ||
    msg.includes("unauthorized") ||
    msg.includes("401")
  ) {
    return "Authentication error. Please refresh the page.";
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
  return "Something went wrong. Please try again.";
}

export function useChat(chatId: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const token = useAuthToken();
  const createMessage = useMutation(api.messages_mutations.create);

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
      if (!token) {
        toast.error("Not authenticated", {
          description: "Please refresh the page to sign in.",
        });
        return false;
      }

      // If a previous request is still streaming, stop it before starting a new one.
      if (abortControllerRef.current) {
        requestIdRef.current += 1;
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Save user message via Convex mutation (appears immediately via reactive query)
      try {
        await createMessage({
          chatId: chatId as Id<"chats">,
          role: "user",
          content,
        });
      } catch (err) {
        toast.error("Failed to save message", {
          description: (err as Error).message,
        });
        return false;
      }

      setIsStreaming(true);
      setStreamingContent("");
      setError(null);

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      void streamChatSSE({
        siteUrl: CONVEX_SITE_URL,
        token,
        chatId,
        model,
        signal: abortController.signal,
        onChunk: (accumulated) => {
          if (requestIdRef.current !== requestId) return;
          setStreamingContent(accumulated);
        },
        onDone: () => {
          if (requestIdRef.current !== requestId) return;
          setStreamingContent("");
          setIsStreaming(false);
          abortControllerRef.current = null;
          // No need to save assistant message — the server already did it.
          // Convex reactive query will deliver the persisted message.
        },
        onError: (err) => {
          if (requestIdRef.current !== requestId) return;
          setError(err);
          setStreamingContent("");
          setIsStreaming(false);
          abortControllerRef.current = null;
          console.error("[useChat] streaming failed:", err);
          const friendly = friendlyErrorMessage(err);
          toast.error(friendly, { duration: 8000 });
        },
      });

      return true;
    },
    [chatId, token, createMessage],
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
