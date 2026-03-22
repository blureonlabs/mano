import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const recurringReservationSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  client_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  end_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  session_type_name: z.string().max(100).nullable(),
  amount_inr: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createRecurringReservationSchema = z.object({
  client_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  end_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  session_type_name: z.string().max(100).nullable().optional(),
  amount_inr: z.number().int().min(0).optional(),
}).refine(
  (d) => d.start_time < d.end_time,
  { message: "start_time must be before end_time", path: ["end_time"] }
);

export const updateRecurringReservationSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
  start_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)").optional(),
  end_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)").optional(),
  session_type_name: z.string().max(100).nullable().optional(),
  amount_inr: z.number().int().min(0).optional(),
});

export type RecurringReservation = z.infer<typeof recurringReservationSchema>;
export type CreateRecurringReservationInput = z.infer<typeof createRecurringReservationSchema>;
export type UpdateRecurringReservationInput = z.infer<typeof updateRecurringReservationSchema>;
