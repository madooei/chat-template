import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

// Hono app typed with Convex action context + userId from auth middleware
type Env = {
  Bindings: {
    ctx: ActionCtx;
    userId: Id<"users">;
  };
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
      const result = streamText({
        model: openrouter.chat(model),
        messages,
      });

      let fullText = "";

      for await (const chunk of (await result).textStream) {
        fullText += chunk;
        await stream.writeSSE({ data: chunk, event: "text-delta" });
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
