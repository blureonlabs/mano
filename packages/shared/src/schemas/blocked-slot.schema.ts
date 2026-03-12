import { z } from "zod";

export const blockedSlotSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().max(200).nullable(),
});

export const createBlockedSlotSchema = z.object({
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

export const updateBlockedSlotSchema = z.object({
  id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

export const deleteBlockedSlotSchema = z.object({
  id: z.string().uuid(),
});

export const listBlockedSlotsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type BlockedSlot = z.infer<typeof blockedSlotSchema>;
export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
export type UpdateBlockedSlotInput = z.infer<typeof updateBlockedSlotSchema>;
export type ListBlockedSlotsInput = z.infer<typeof listBlockedSlotsSchema>;
