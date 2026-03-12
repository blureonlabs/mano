import { z } from "zod";

// Session type configuration (stored as JSONB array on therapists table)
export const sessionTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  duration_mins: z.number().int().min(5).max(300),
  rate_inr: z.number().int().min(0), // paise, 0 = free
  description: z.string().max(500).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type SessionType = z.infer<typeof sessionTypeSchema>;

export const updateSessionTypesSchema = z.object({
  session_types: z.array(sessionTypeSchema).min(1).max(10),
});

export type UpdateSessionTypesInput = z.infer<typeof updateSessionTypesSchema>;

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
  session_types: z.array(sessionTypeSchema).default([]),
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
  session_types: true,
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
  start_time: z.string(), // HH:mm
  end_time: z.string(),
  is_active: z.boolean().default(true),
});

export const setAvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_active: z.boolean().default(true),
});

export type Availability = z.infer<typeof availabilitySchema>;
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
