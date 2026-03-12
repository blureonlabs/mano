import { z } from "zod";

export const bookSessionSchema = z.object({
  therapist_slug: z.string().min(2),
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  client_phone: z.string().max(20).optional(),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
  razorpay_payment_id: z.string().optional(),
});

export const getAvailableSlotsSchema = z.object({
  therapist_slug: z.string().min(2),
  from_date: z.string(), // YYYY-MM-DD
  to_date: z.string(),   // YYYY-MM-DD
});

export type BookSessionInput = z.infer<typeof bookSessionSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;

export type TimeSlot = {
  start: string; // ISO 8601
  end: string;   // ISO 8601
};
