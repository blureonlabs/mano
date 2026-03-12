import { z } from "zod";

export const senderTypeEnum = z.enum(["therapist", "client"]);

export const messageSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  client_id: z.string().uuid(),
  sender_type: senderTypeEnum,
  content: z.string().min(1).max(5000),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const sendMessageSchema = z.object({
  client_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export type Message = z.infer<typeof messageSchema>;
export type SenderType = z.infer<typeof senderTypeEnum>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
