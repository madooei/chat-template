import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface GenerateTitleOptions {
  apiKey: string;
  messages: { role: "user" | "assistant"; content: string }[];
  model?: string;
}

export async function generateChatTitle({
  apiKey,
  messages,
  model = "gemini-2.0-flash",
}: GenerateTitleOptions): Promise<string | null> {
  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const excerpt = messages
      .slice(0, 6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const result = streamText({
      model: google(model),
      messages: [
        {
          role: "user",
          content: `Generate a short title (3-6 words) for the following conversation. Return only the title, no quotes or punctuation.\n\n${excerpt}`,
        },
      ],
    });

    let title = "";
    for await (const chunk of (await result).textStream) {
      title += chunk;
    }

    return title.trim() || null;
  } catch {
    return null;
  }
}

interface StreamChatOptions {
  apiKey: string;
  messages: { role: "user" | "assistant"; content: string }[];
  model?: string;
  abortSignal?: AbortSignal;
  onChunk?: (accumulatedText: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export async function streamChat({
  apiKey,
  messages,
  model = "gemini-2.0-flash",
  abortSignal,
  onChunk,
  onFinish,
  onError,
}: StreamChatOptions) {
  try {
    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google(model),
      messages,
      abortSignal,
    });

    let accumulated = "";
    for await (const chunk of (await result).textStream) {
      accumulated += chunk;
      onChunk?.(accumulated);
    }

    onFinish?.(accumulated);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return;
    }
    onError?.(error as Error);
  }
}
