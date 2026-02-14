import { z } from "zod";

export const createMessageSchema = z.object({
  chatId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const updateMessageSchema = createMessageSchema.partial();

export const messageSchema = createMessageSchema.extend({
  _id: z.string(),
  _creationTime: z.number(),
});

export type CreateMessageType = z.infer<typeof createMessageSchema>;
export type UpdateMessageType = z.infer<typeof updateMessageSchema>;
export type MessageType = z.infer<typeof messageSchema>;
