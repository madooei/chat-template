import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MastraClient } from "@mastra/client-js";
import { getSettings } from "@/settings/store/settings";
import { MASTRA_ENDPOINT } from "@/config/env";

interface GenerateTitleOptions {
  apiKey: string;
  model: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

export async function generateChatTitle({
  apiKey,
  model,
  messages,
}: GenerateTitleOptions): Promise<string | null> {
  try {
    const openrouter = createOpenRouter({ apiKey });

    const excerpt = messages
      .slice(0, 6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    let streamError: Error | null = null;

    const result = streamText({
      model: openrouter.chat(model),
      messages: [
        {
          role: "user",
          content: `Generate a short title (3-6 words) for the following conversation. Return only the title, no quotes or punctuation.\n\n${excerpt}`,
        },
      ],
      onError({ error }) {
        streamError = error instanceof Error ? error : new Error(String(error));
      },
    });

    let title = "";
    for await (const chunk of (await result).textStream) {
      title += chunk;
    }

    if (streamError) throw streamError;

    return title.trim() || null;
  } catch {
    return null;
  }
}

interface StreamChatOptions {
  apiKey: string;
  model: string;
  messages: { role: "user" | "assistant"; content: string }[];
  abortSignal?: AbortSignal;
  onChunk?: (accumulatedText: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export async function streamChat({
  apiKey,
  model,
  messages,
  abortSignal,
  onChunk,
  onFinish,
  onError,
}: StreamChatOptions) {
  try {
    const openrouter = createOpenRouter({ apiKey });

    let streamError: Error | null = null;

    const result = streamText({
      model: openrouter.chat(model),
      messages,
      abortSignal,
      onError({ error }) {
        streamError = error instanceof Error ? error : new Error(String(error));
      },
    });

    let accumulated = "";
    for await (const chunk of (await result).textStream) {
      accumulated += chunk;
      onChunk?.(accumulated);
    }

    if (streamError) throw streamError;

    onFinish?.(accumulated);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return;
    }
    onError?.(error as Error);
  }
}

export function getMastraEndpoint(): string {
  const settings = getSettings();
  return settings.mastraEndpoint?.trim() || MASTRA_ENDPOINT;
}

interface StreamMastraChatOptions {
  endpoint: string;
  agentId: string;
  messages: { role: "user" | "assistant"; content: string }[];
  abortSignal?: AbortSignal;
  onChunk?: (accumulatedText: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: Error) => void;
  onToolCall?: (event: {
    toolCallId: string;
    toolName: string;
    args?: unknown;
  }) => void;
  onToolResult?: (event: {
    toolCallId: string;
    toolName: string;
    result?: unknown;
    isError?: boolean;
  }) => void;
}

export async function streamMastraChat({
  endpoint,
  agentId,
  messages,
  abortSignal,
  onChunk,
  onFinish,
  onError,
  onToolCall,
  onToolResult,
}: StreamMastraChatOptions) {
  try {
    const client = new MastraClient({
      baseUrl: endpoint,
      abortSignal,
    });
    const agent = client.getAgent(agentId);
    // MessageListInput accepts CoreMessage[] but that type lives in @mastra/core
    // which is not a frontend dependency — cast through unknown to satisfy TS.
    const response = await agent.stream(
      messages as unknown as Parameters<typeof agent.stream>[0],
    );

    let accumulated = "";
    await response.processDataStream({
      onChunk: async (chunk) => {
        if (chunk.type === "text-delta") {
          accumulated += chunk.payload.text;
          onChunk?.(accumulated);
        } else if (chunk.type === "tool-call") {
          onToolCall?.({
            toolCallId: chunk.payload.toolCallId as string,
            toolName: chunk.payload.toolName as string,
            args: chunk.payload.args,
          });
        } else if (chunk.type === "tool-result") {
          onToolResult?.({
            toolCallId: chunk.payload.toolCallId as string,
            toolName: chunk.payload.toolName as string,
            result: chunk.payload.result,
            isError: chunk.payload.isError as boolean | undefined,
          });
        }
      },
    });

    onFinish?.(accumulated);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return;
    }
    onError?.(error as Error);
  }
}
