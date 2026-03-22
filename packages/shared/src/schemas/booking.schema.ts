import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_DATE_RANGE_DAYS = 90;

export const bookSessionSchema = z.object({
  therapist_slug: z.string().min(2).max(50).regex(SLUG_REGEX),
  session_type_id: z.string().uuid(),
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  client_phone: z.string().max(20).optional(),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
  razorpay_payment_id: z.string().min(10).optional(),
}).refine(
  (d) => d.slot_start < d.slot_end,
  { message: "slot_start must be before slot_end", path: ["slot_end"] }
);

export const getAvailableSlotsSchema = z.object({
  therapist_slug: z.string().min(2).max(50).regex(SLUG_REGEX),
  session_type_id: z.string().uuid(),
  from_date: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD"),
  to_date: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD"),
}).refine(
  (d) => {
    const from = new Date(d.from_date);
    const to = new Date(d.to_date);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return false;
    if (from > to) return false;
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_DATE_RANGE_DAYS;
  },
  { message: `Date range must be valid and at most ${MAX_DATE_RANGE_DAYS} days`, path: ["to_date"] }
);

// Multi-session booking (book N slots at once, e.g., 4 Tuesdays)
export const bookMultipleSessionsSchema = z.object({
  therapist_slug: z.string().min(2).max(50).regex(SLUG_REGEX),
  session_type_id: z.string().uuid(),
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  client_phone: z.string().max(20).optional(),
  slots: z.array(z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).refine(
    (s) => s.start < s.end,
    { message: "start must be before end", path: ["end"] }
  )).min(1).max(12),
  razorpay_payment_id: z.string().min(10).optional(),
});

export type BookSessionInput = z.infer<typeof bookSessionSchema>;
export type BookMultipleSessionsInput = z.infer<typeof bookMultipleSessionsSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;

export type TimeSlot = {
  start: string; // ISO 8601
  end: string;   // ISO 8601
};
