import { z } from "zod";

export const broadcastChannelEnum = z.enum(["whatsapp", "email", "both"]);

export const sendBroadcastSchema = z.object({
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  channel: broadcastChannelEnum.default("both"),
  client_ids: z.array(z.string().uuid()).min(1).max(200),
});

export type BroadcastChannel = z.infer<typeof broadcastChannelEnum>;
export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;
