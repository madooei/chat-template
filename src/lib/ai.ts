import { MastraClient } from "@mastra/client-js";
import { getSettings } from "@/settings/store/settings";
import { MASTRA_ENDPOINT } from "@/config/env";

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
