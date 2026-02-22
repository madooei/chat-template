import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

/**
 * Auto-generate a short title for a chat if it's still "New Chat".
 * Best-effort — errors are silently swallowed.
 */
export async function autoTitleChat({
  ctx,
  chatId,
  model,
  currentTitle,
  messages,
  assistantContent,
}: {
  ctx: ActionCtx;
  chatId: Id<"chats">;
  model: string;
  currentTitle: string;
  messages: { role: string; content: string }[];
  assistantContent: string;
}): Promise<void> {
  if (currentTitle !== "New Chat" || assistantContent.length === 0) return;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    const openrouter = createOpenRouter({ apiKey });
    const titleMessages = [
      ...messages,
      { role: "assistant" as const, content: assistantContent },
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
    // Title generation is best-effort — don't fail the caller
  }
}
