import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { useSelector } from "@legendapp/state/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuthToken } from "@/hooks/use-auth-token";
import { streamChatSSE } from "@/lib/sse";
import { CONVEX_SITE_URL } from "@/lib/convex";
import { streamMastraChat, getMastraEndpoint } from "@/lib/ai";
import type { ToolCallPart } from "@/messages/types/tool-call";
import type { ResearchPhase, ToolEvent } from "@/messages/types/research";
import {
  startStreaming,
  appendStreamingContent,
  setStreamingMessageId,
  setStreamingToolCalls,
  clearStreaming,
  addOptimisticMessage,
  removeOptimisticMessage,
  chatMessages$,
  getStreamingState,
} from "@/messages/store/messages";

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
  if (msg.includes("mastra")) {
    return "Could not reach the Mastra server. Make sure it is running.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Wait for a persisted message with the given ID to appear with isComplete !== false.
 * Uses `!== false` (not `=== true`) for backward compatibility with messages that
 * predate the isComplete field — those have `undefined`, which should count as complete.
 * Polls at 50ms intervals with a 5s timeout.
 */
function waitForPersistedMessage(
  chatId: string,
  messageId: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const TIMEOUT = 5000;
    const INTERVAL = 50;

    const check = () => {
      const persisted = chatMessages$[chatId]?.persisted?.peek() ?? [];
      const found = persisted.find(
        (m) => m._id === messageId && m.isComplete !== false,
      );
      if (found) {
        resolve(true);
        return;
      }
      if (Date.now() - startTime >= TIMEOUT) {
        resolve(false);
        return;
      }
      setTimeout(check, INTERVAL);
    };
    check();
  });
}

export function useChat(chatId: string) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const toolCallsRef = useRef<Map<string, ToolCallPart>>(new Map());
  const token = useAuthToken();
  const createMessage = useMutation(api.messages_mutations.create);

  // Streaming state from Legend-State (phase-2 architecture)
  const isStreaming = useSelector(
    () => chatMessages$[chatId]?.streaming?.isStreaming?.get() ?? false,
  );
  const streamingContent = useSelector(
    () => chatMessages$[chatId]?.streaming?.content?.get() ?? "",
  );
  const toolCalls = useSelector(
    () => chatMessages$[chatId]?.streaming?.toolCalls?.get() ?? [],
  );

  // Research state (phase-3 Mastra integration)
  const [researchPhase, setResearchPhase] = useState<ResearchPhase>("idle");
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);

  useEffect(() => {
    return () => {
      // Invalidate any pending callbacks for the current request and cancel it.
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      model: string,
      useResearch = false,
    ): Promise<boolean> => {
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

      // Local-first: add optimistic user message immediately
      const clientId = crypto.randomUUID();
      addOptimisticMessage(chatId, clientId, {
        _id: `optimistic-${clientId}`,
        chatId,
        role: "user",
        content,
        clientId,
        _creationTime: Date.now(),
      });

      // Persist user message via Convex mutation
      try {
        await createMessage({
          chatId: chatId as Id<"chats">,
          role: "user",
          content,
          clientId,
        });
      } catch (err: unknown) {
        removeOptimisticMessage(chatId, clientId);
        toast.error("Failed to save message", {
          description: (err as Error).message,
        });
        return false;
      }

      // Set up streaming state
      startStreaming(chatId);
      toolCallsRef.current = new Map();

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (useResearch) {
        // Research path: two-phase Mastra flow (research agent → report agent)
        // Currently calls Mastra directly from the frontend.
        // TODO: Refactor to route through Convex HTTP endpoint (step 2).
        setResearchPhase("researching");
        setToolEvents([]);

        const persistedMessages =
          chatMessages$[chatId]?.persisted?.peek() ?? [];
        const history = persistedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        void streamMastraChat({
          endpoint: getMastraEndpoint(),
          agentId: "research-agent",
          messages: history,
          abortSignal: abortController.signal,
          onToolCall: (event) => {
            if (requestIdRef.current !== requestId) return;
            setToolEvents((prev) => [
              ...prev,
              {
                id: event.toolCallId,
                toolName: event.toolName,
                status: "running",
                args: event.args,
                timestamp: Date.now(),
              },
            ]);
          },
          onToolResult: (event) => {
            if (requestIdRef.current !== requestId) return;
            setToolEvents((prev) =>
              prev.map((te) =>
                te.id === event.toolCallId
                  ? {
                      ...te,
                      status: event.isError ? "error" : "completed",
                      result: event.result,
                    }
                  : te,
              ),
            );
          },
          // Research text is accumulated silently — not shown to the user
          onChunk: undefined,
          onFinish: (researchText) => {
            if (requestIdRef.current !== requestId) return;

            // Phase 2: call report agent to produce a clean markdown report
            setResearchPhase("reporting");

            const reportPrompt = `Based on the following research data, write a comprehensive report answering: ${content}\n\nResearch Data:\n${researchText}`;

            void streamMastraChat({
              endpoint: getMastraEndpoint(),
              agentId: "report-agent",
              messages: [{ role: "user", content: reportPrompt }],
              abortSignal: abortController.signal,
              onChunk: (accumulated) => {
                if (requestIdRef.current !== requestId) return;
                appendStreamingContent(chatId, accumulated);
              },
              onFinish: (fullText) => {
                if (requestIdRef.current !== requestId) return;
                // Persist assistant message via Convex
                void createMessage({
                  chatId: chatId as Id<"chats">,
                  role: "assistant",
                  content: fullText,
                }).catch(() => {
                  // Silently fail — message is already visible via streaming
                });
                setResearchPhase("idle");
                setToolEvents([]);
                abortControllerRef.current = null;
                clearStreaming(chatId);
              },
              onError: (err) => {
                if (requestIdRef.current !== requestId) return;
                abortControllerRef.current = null;
                setResearchPhase("idle");
                setToolEvents([]);
                clearStreaming(chatId);
                console.error("[useChat] research reporting failed:", err);
                toast.error(friendlyErrorMessage(err), { duration: 8000 });
              },
            });
          },
          onError: (err) => {
            if (requestIdRef.current !== requestId) return;
            abortControllerRef.current = null;
            setResearchPhase("idle");
            setToolEvents([]);
            clearStreaming(chatId);
            console.error("[useChat] research streaming failed:", err);
            toast.error(friendlyErrorMessage(err), { duration: 8000 });
          },
        });
      } else {
        // Normal chat path: Convex SSE streaming (phase-2 architecture)
        streamChatSSE({
          siteUrl: CONVEX_SITE_URL,
          token,
          chatId,
          model,
          signal: abortController.signal,
          onMessageCreated: (data) => {
            if (requestIdRef.current !== requestId) return;
            setStreamingMessageId(chatId, data.messageId);
          },
          onChunk: (accumulated) => {
            if (requestIdRef.current !== requestId) return;
            appendStreamingContent(chatId, accumulated);
          },
          onToolCall: ({ toolCallId, toolName, args }) => {
            if (requestIdRef.current !== requestId) return;
            const part: ToolCallPart = {
              toolCallId,
              toolName,
              state: "input-available",
              args,
            };
            toolCallsRef.current.set(toolCallId, part);
            setStreamingToolCalls(
              chatId,
              Array.from(toolCallsRef.current.values()),
            );
          },
          onToolResult: ({ toolCallId, toolName, result }) => {
            if (requestIdRef.current !== requestId) return;
            const existing = toolCallsRef.current.get(toolCallId);
            const part: ToolCallPart = {
              toolCallId,
              toolName,
              state: "output-available",
              args: existing?.args ?? {},
              result,
            };
            toolCallsRef.current.set(toolCallId, part);
            setStreamingToolCalls(
              chatId,
              Array.from(toolCallsRef.current.values()),
            );
          },
          onDone: () => {
            if (requestIdRef.current !== requestId) return;
            abortControllerRef.current = null;
            toolCallsRef.current = new Map();

            // Wait for persisted message before clearing streaming state
            const { messageId } = getStreamingState(chatId);
            if (messageId) {
              void waitForPersistedMessage(chatId, messageId).then(() => {
                if (requestIdRef.current !== requestId) return;
                clearStreaming(chatId);
              });
            } else {
              clearStreaming(chatId);
            }
          },
          onError: (err) => {
            if (requestIdRef.current !== requestId) return;
            abortControllerRef.current = null;
            toolCallsRef.current = new Map();
            clearStreaming(chatId);
            console.error("[useChat] streaming failed:", err);
            const friendly = friendlyErrorMessage(err);
            toast.error(friendly, { duration: 8000 });
          },
        }).catch((err: unknown) => {
          // Safety net: if onError itself throws, ensure streaming state is cleaned up.
          clearStreaming(chatId);
          console.error("[useChat] unexpected streaming error:", err);
        });
      }

      return true;
    },
    [chatId, token, createMessage],
  );

  const abort = useCallback(() => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    toolCallsRef.current = new Map();
    setResearchPhase("idle");
    setToolEvents([]);
    clearStreaming(chatId);
  }, [chatId]);

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error: null as Error | null,
    abort,
    toolCalls,
    researchPhase,
    toolEvents,
  };
}
