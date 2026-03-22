import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Session type configuration (stored as JSONB array on therapists table)
export const sessionTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  duration_mins: z.number().int().min(5).max(300),
  rate_inr: z.number().int().min(0), // paise, 0 = free
  description: z.string().max(500).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  intake_form_id: z.string().uuid().nullable().optional(),
});

export type SessionType = z.infer<typeof sessionTypeSchema>;

export const updateSessionTypesSchema = z.object({
  session_types: z.array(sessionTypeSchema).min(1).max(10),
});

export type UpdateSessionTypesInput = z.infer<typeof updateSessionTypesSchema>;

export const customTagsSchema = z.object({
  modalities: z.array(z.object({
    key: z.string().max(100),
    name: z.string().max(100),
    fullName: z.string().max(200),
  })).max(50).optional(),
  techniques: z.array(z.string().max(100)).max(50).optional(),
  categories: z.array(z.string().max(100)).max(50).optional(),
  risk_flags: z.array(z.string().max(100)).max(50).optional(),
}).nullable();

export type CustomTags = z.infer<typeof customTagsSchema>;

export const therapistSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(200),
  display_name: z.string().max(100).nullable(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  bio: z.string().max(2000).nullable(),
  qualifications: z.string().max(500).nullable(),
  phone: z.string().max(20).nullable(),
  avatar_url: z.string().url().nullable(),
  timezone: z.string().default("Asia/Kolkata"),
  session_duration_mins: z.number().int().min(15).max(180).default(50),
  buffer_mins: z.number().int().min(0).max(60).default(10),
  session_rate_inr: z.number().int().min(0).default(150000), // paise
  booking_page_active: z.boolean().default(true),
  cancellation_policy: z.string().max(1000).nullable(),
  late_policy: z.string().max(1000).nullable(),
  rescheduling_policy: z.string().max(1000).nullable(),
  cancellation_hours: z.number().int().min(0).max(168).default(24),
  min_booking_advance_hours: z.number().int().min(0).max(168).default(24),
  no_show_charge_percent: z.number().int().min(0).max(100).default(100),
  late_cancel_charge_percent: z.number().int().min(0).max(100).default(100),
  session_types: z.array(sessionTypeSchema).default([]),
  custom_tags: customTagsSchema.default(null),
  gstin: z.string().max(15).nullable(),
  google_connected: z.boolean().default(false),
  zoom_connected: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createTherapistSchema = therapistSchema.pick({
  full_name: true,
  display_name: true,
  slug: true,
  bio: true,
  qualifications: true,
  phone: true,
  timezone: true,
  session_duration_mins: true,
  buffer_mins: true,
  session_rate_inr: true,
  booking_page_active: true,
  cancellation_policy: true,
  late_policy: true,
  rescheduling_policy: true,
  cancellation_hours: true,
  min_booking_advance_hours: true,
  no_show_charge_percent: true,
  late_cancel_charge_percent: true,
  session_types: true,
  custom_tags: true,
  gstin: true,
});

export const updateTherapistSchema = createTherapistSchema.partial();

export type Therapist = z.infer<typeof therapistSchema>;
export type CreateTherapistInput = z.infer<typeof createTherapistSchema>;
export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;

// Availability
export const availabilitySchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6), // 0=Sun, 6=Sat
  start_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  end_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  is_active: z.boolean().default(true),
});

export const setAvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  end_time: z.string().regex(TIME_REGEX, "Must be HH:mm (00:00-23:59)"),
  is_active: z.boolean().default(true),
}).refine(
  (d) => d.start_time < d.end_time,
  { message: "start_time must be before end_time", path: ["end_time"] }
);

export type Availability = z.infer<typeof availabilitySchema>;
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
