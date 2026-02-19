import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { getLocation, getCurrentWeather } from "./weather";

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
    try {
      console.log("[chat] tools enabled:", Object.keys(weatherTools));
      const result = streamText({
        model: openrouter.chat(model),
        messages,
        tools: weatherTools,
        stopWhen: stepCountIs(5),
        system:
          "You are a helpful assistant. When the user asks about weather, use the provided tools to look up weather information. Always call getLocation first to get the latitude and longitude, then use those coordinates with getCurrentWeather.",
        onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
          console.log("[chat] step finished:", {
            finishReason,
            toolCalls: toolCalls?.length ?? 0,
            toolResults: toolResults?.length ?? 0,
            textLength: text?.length ?? 0,
          });
        },
      });

      let fullText = "";

      for await (const part of (await result).fullStream) {
        console.log("[chat] stream part:", part.type);
        switch (part.type) {
          case "text-delta":
            fullText += part.text;
            await stream.writeSSE({
              data: part.text,
              event: "text-delta",
            });
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

      // Save assistant message to DB
      await ctx.runMutation(internal.messages_internals.saveAssistantMessage, {
        chatId,
        userId,
        content: fullText,
        model,
      });

      // Auto-title if still "New Chat"
      if (
        ownership.ok &&
        ownership.title === "New Chat" &&
        fullText.length > 0
      ) {
        try {
          const titleMessages = [
            ...messages,
            { role: "assistant" as const, content: fullText },
          ];
          const excerpt = titleMessages
            .slice(0, 6)
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n");

          const titleResult = streamText({
            model: openrouter.chat(model),
            messages: [
              {
                role: "user",
                content: `Generate a short title (3-6 words) for the following conversation. Return only the title, no quotes or punctuation.\n\n${excerpt}`,
              },
            ],
          });

          let title = "";
          for await (const chunk of (await titleResult).textStream) {
            title += chunk;
          }
          title = title.trim();

          if (title) {
            await ctx.runMutation(internal.messages_internals.updateChatTitle, {
              chatId,
              title,
            });
          }
        } catch {
          // Title generation is best-effort — don't fail the stream
        }
      }

      await stream.writeSSE({ data: "[DONE]", event: "text-delta" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await stream.writeSSE({
        data: `[ERROR]: ${message}`,
        event: "text-delta",
      });
    }
  });
});

export default app;
