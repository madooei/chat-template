import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MastraClient } from "@mastra/client-js";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { getLocation, getCurrentWeather } from "./weather";
import { autoTitleChat } from "./http_helpers";

// Hono app typed with Convex action context + userId from auth middleware
type Env = {
  Bindings: {
    ctx: ActionCtx;
    userId: Id<"users">;
  };
};

const weatherTools = {
  getLocation: tool({
    description:
      "Given a city name, returns the location with latitude and longitude coordinates",
    inputSchema: z.object({
      city: z.string().describe("City name, e.g. Baltimore"),
    }),
    execute: async ({ city }) => getLocation(city),
  }),
  getCurrentWeather: tool({
    description:
      "Given latitude and longitude coordinates, returns the current weather conditions",
    inputSchema: z.object({
      latitude: z.number().describe("Latitude coordinate, e.g. 39.29"),
      longitude: z.number().describe("Longitude coordinate, e.g. -76.61"),
    }),
    execute: async ({ latitude, longitude }) =>
      getCurrentWeather(latitude, longitude),
  }),
};

const app = new Hono<Env>();

app.post("/api/chat", async (c) => {
  const { ctx, userId } = c.env;

  // Parse request body
  let chatId: Id<"chats">;
  let model: string;
  try {
    const body = await c.req.json();
    chatId = body.chatId;
    model = body.model;
    if (!chatId || !model) throw new Error("Missing chatId or model");
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  // Verify chat ownership
  const ownership = await ctx.runQuery(
    internal.messages_internals.verifyChatOwnership,
    { chatId, userId },
  );
  if (!ownership.ok) {
    return c.json({ error: ownership.error }, 403);
  }

  // Read message history
  const messages = await ctx.runQuery(
    internal.messages_internals.getMessagesByChat,
    { chatId },
  );

  // Set up AI provider
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Server API key not configured" }, 500);
  }

  const openrouter = createOpenRouter({ apiKey });

  return streamSSE(c, async (stream) => {
    // Flush configuration
    const FLUSH_INTERVAL_MS = 200;
    const MIN_FLUSH_SIZE = 100;

    let messageId: Awaited<ReturnType<typeof ctx.runMutation>> | null = null;
    let fullText = "";

    try {
      // Create placeholder assistant message before streaming begins
      messageId = await ctx.runMutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model },
      );

      // Notify client of the created message ID
      await stream.writeSSE({
        data: JSON.stringify({ messageId }),
        event: "message-created",
      });

      // Deep research tool — runs the full Mastra pipeline and writes SSE
      // events directly to the Hono stream via closure.
      const deepResearch = tool({
        description:
          "Perform deep web research on a complex question that requires searching multiple sources, synthesizing information, and producing a comprehensive report. " +
          "Only call this tool for questions that genuinely need multi-source research — for example, comparing technologies, investigating recent events, or analyzing trends. " +
          "Do NOT call this for greetings, simple factual questions, math, coding help, or anything you can answer from your training data.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The research question to investigate thoroughly"),
        }),
        execute: async ({ query }) => {
          const mastraUrl = process.env.MASTRA_URL;
          if (!mastraUrl) {
            throw new Error(
              "MASTRA_URL not configured — cannot perform deep research",
            );
          }

          // Phase 1: Research agent
          await stream.writeSSE({
            data: JSON.stringify({ phase: "researching" }),
            event: "research-phase",
          });

          const client = new MastraClient({ baseUrl: mastraUrl });
          const researchAgent = client.getAgent("research-agent");

          const researchResponse = await researchAgent.stream(
            messages as unknown as Parameters<typeof researchAgent.stream>[0],
          );

          let researchText = "";
          await researchResponse.processDataStream({
            onChunk: async (chunk) => {
              if (chunk.type === "text-delta") {
                researchText += (chunk.payload as { text: string }).text;
              } else if (chunk.type === "tool-call") {
                const payload = chunk.payload as {
                  toolCallId: string;
                  toolName: string;
                  args: unknown;
                };
                await stream.writeSSE({
                  data: JSON.stringify({
                    toolCallId: payload.toolCallId,
                    toolName: payload.toolName,
                    args: payload.args,
                  }),
                  event: "tool-call",
                });
              } else if (chunk.type === "tool-result") {
                const payload = chunk.payload as {
                  toolCallId: string;
                  toolName: string;
                  result: unknown;
                  isError?: boolean;
                };
                await stream.writeSSE({
                  data: JSON.stringify({
                    toolCallId: payload.toolCallId,
                    toolName: payload.toolName,
                    result: payload.result,
                    ...(payload.isError && { isError: true }),
                  }),
                  event: "tool-result",
                });
              }
            },
          });

          // Phase 2: Report agent
          await stream.writeSSE({
            data: JSON.stringify({ phase: "reporting" }),
            event: "research-phase",
          });

          const reportPrompt =
            `Based on the following research data, write a comprehensive report answering: ${query}\n\n` +
            `Research Data:\n${researchText}`;

          const reportAgent = client.getAgent("report-agent");
          const reportResponse = await reportAgent.stream([
            { role: "user", content: reportPrompt },
          ] as unknown as Parameters<typeof reportAgent.stream>[0]);

          let unflushedLength = 0;
          let lastFlushTime = Date.now();

          await reportResponse.processDataStream({
            onChunk: async (chunk) => {
              if (chunk.type === "text-delta") {
                const text = (chunk.payload as { text: string }).text;
                fullText += text;
                unflushedLength += text.length;

                await stream.writeSSE({
                  data: text,
                  event: "text-delta",
                });

                // Periodic DB flush
                if (
                  messageId &&
                  unflushedLength >= MIN_FLUSH_SIZE &&
                  Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS
                ) {
                  await ctx.runMutation(
                    internal.messages_internals.updateStreamingContent,
                    { messageId, content: fullText },
                  );
                  unflushedLength = 0;
                  lastFlushTime = Date.now();
                }
              }
            },
          });

          // Signal research complete
          await stream.writeSSE({
            data: JSON.stringify({ phase: "idle" }),
            event: "research-phase",
          });

          return { completed: true };
        },
      });

      const tools = { ...weatherTools, deepResearch };

      console.log("[chat] tools enabled:", Object.keys(tools));
      const result = streamText({
        model: openrouter.chat(model),
        messages,
        tools,
        stopWhen: stepCountIs(5),
        system:
          "You are a helpful, general-purpose assistant. " +
          "You have access to weather tools — if the user asks about weather, call getLocation first to get coordinates, then use getCurrentWeather with those coordinates. " +
          "You also have a deepResearch tool for complex questions that require searching multiple web sources and synthesizing a comprehensive report. " +
          "Only use deepResearch for questions that genuinely need multi-source web research. Do not use it for greetings, simple questions, coding help, or anything you can answer directly.",
        onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
          console.log("[chat] step finished:", {
            finishReason,
            toolCalls: toolCalls?.length ?? 0,
            toolResults: toolResults?.length ?? 0,
            textLength: text?.length ?? 0,
          });
        },
      });

      fullText = "";
      let unflushedLength = 0;
      let lastFlushTime = Date.now();

      for await (const part of (await result).fullStream) {
        console.log("[chat] stream part:", part.type);

        // Suppress deepResearch tool events — the execute function already
        // wrote SSE events directly to the stream.
        if (
          (part.type === "tool-call" || part.type === "tool-result") &&
          part.toolName === "deepResearch"
        ) {
          continue;
        }

        switch (part.type) {
          case "text-delta":
            fullText += part.text;
            unflushedLength += part.text.length;
            await stream.writeSSE({
              data: part.text,
              event: "text-delta",
            });

            // Periodic DB flush
            if (
              unflushedLength >= MIN_FLUSH_SIZE &&
              Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS
            ) {
              await ctx.runMutation(
                internal.messages_internals.updateStreamingContent,
                { messageId, content: fullText },
              );
              unflushedLength = 0;
              lastFlushTime = Date.now();
            }
            break;
          case "tool-call":
            await stream.writeSSE({
              data: JSON.stringify({
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: part.input,
              }),
              event: "tool-call",
            });
            break;
          case "tool-result":
            await stream.writeSSE({
              data: JSON.stringify({
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                result: part.output,
              }),
              event: "tool-result",
            });
            break;
        }
      }

      // Final flush: mark message as complete BEFORE sending [DONE]
      await ctx.runMutation(
        internal.messages_internals.completeStreamingMessage,
        { messageId, content: fullText },
      );

      // Auto-title if still "New Chat"
      if (ownership.ok) {
        await autoTitleChat({
          ctx,
          chatId,
          model,
          currentTitle: ownership.title,
          messages,
          assistantContent: fullText,
        });
      }

      await stream.writeSSE({ data: "[DONE]", event: "text-delta" });
    } catch (error) {
      // On error, save whatever accumulated text exists
      if (messageId) {
        try {
          await ctx.runMutation(
            internal.messages_internals.completeStreamingMessage,
            { messageId, content: fullText },
          );
        } catch {
          // Best-effort error recovery
        }
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      await stream.writeSSE({
        data: `[ERROR]: ${message}`,
        event: "text-delta",
      });
    }
  });
});

export default app;
