import { z } from "zod";

export const sessionStatusEnum = z.enum([
  "pending_approval",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);

export const paymentStatusEnum = z.enum([
  "pending",
  "paid",
  "refunded",
  "waived",
]);

export const sessionSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  client_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  duration_mins: z.number().int().default(50),
  status: sessionStatusEnum.default("scheduled"),
  zoom_meeting_id: z.string().nullable(),
  zoom_join_url: z.string().url().nullable(),
  zoom_start_url: z.string().url().nullable(),
  google_event_id: z.string().nullable(),
  payment_status: paymentStatusEnum.default("pending"),
  amount_inr: z.number().int().nullable(), // paise
  razorpay_payment_id: z.string().nullable(),
  reminder_24h_sent: z.boolean().default(false),
  reminder_1h_sent: z.boolean().default(false),
  session_number: z.number().int().nullable(),
  session_type_name: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  cancelled_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const cancelSessionSchema = z.object({
  session_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const listSessionsByDateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const createManualSessionSchema = z.object({
  client_id: z.string().uuid(),
  session_type_id: z.string().uuid().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export type Session = z.infer<typeof sessionSchema>;
export type SessionStatus = z.infer<typeof sessionStatusEnum>;
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;
export type ListSessionsByDateRangeInput = z.infer<typeof listSessionsByDateRangeSchema>;
export type CreateManualSessionInput = z.infer<typeof createManualSessionSchema>;

// Session Notes
export const noteTypeEnum = z.enum(["soap", "dap", "birp", "freeform"]);

export const sessionNoteSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  note_type: noteTypeEnum.default("soap"),
  subjective: z.string().nullable(),
  objective: z.string().nullable(),
  assessment: z.string().nullable(),
  plan: z.string().nullable(),
  freeform_content: z.string().nullable(),
  homework: z.string().nullable(),
  techniques_used: z.array(z.string()).default([]),
  risk_flags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createSessionNoteSchema = z.object({
  session_id: z.string().uuid(),
  note_type: noteTypeEnum.default("soap"),
  subjective: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  freeform_content: z.string().nullable().optional(),
  homework: z.string().nullable().optional(),
  techniques_used: z.array(z.string()).optional(),
  risk_flags: z.array(z.string()).optional(),
});

export const updateSessionNoteSchema = createSessionNoteSchema
  .omit({ session_id: true })
  .partial();

export type SessionNote = z.infer<typeof sessionNoteSchema>;
export type NoteType = z.infer<typeof noteTypeEnum>;
export type CreateSessionNoteInput = z.infer<typeof createSessionNoteSchema>;
export type UpdateSessionNoteInput = z.infer<typeof updateSessionNoteSchema>;
