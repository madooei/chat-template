import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { MastraClient } from "@mastra/client-js";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { autoTitleChat } from "./http_helpers";

type Env = {
  Bindings: {
    ctx: ActionCtx;
    userId: Id<"users">;
  };
};

const app = new Hono<Env>();

app.post("/api/research", async (c) => {
  const { ctx, userId } = c.env;

  // Parse request body
  let chatId: Id<"chats">;
  let model: string;
  let userMessage: string;
  try {
    const body = await c.req.json();
    chatId = body.chatId;
    model = body.model;
    userMessage = body.userMessage;
    if (!chatId || !model || !userMessage)
      throw new Error("Missing chatId, model, or userMessage");
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

  // Validate Mastra URL
  const mastraUrl = process.env.MASTRA_URL;
  if (!mastraUrl) {
    return c.json({ error: "MASTRA_URL not configured" }, 500);
  }

  return streamSSE(c, async (stream) => {
    const FLUSH_INTERVAL_MS = 200;
    const MIN_FLUSH_SIZE = 100;

    let messageId: Awaited<ReturnType<typeof ctx.runMutation>> | null = null;
    let fullText = "";

    try {
      // Create placeholder assistant message
      messageId = await ctx.runMutation(
        internal.messages_internals.createStreamingMessage,
        { chatId, userId, model },
      );

      await stream.writeSSE({
        data: JSON.stringify({ messageId }),
        event: "message-created",
      });

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
        `Based on the following research data, write a comprehensive report answering: ${userMessage}\n\n` +
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

      // Final flush: mark message as complete
      if (messageId) {
        await ctx.runMutation(
          internal.messages_internals.completeStreamingMessage,
          { messageId, content: fullText },
        );
      }

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
