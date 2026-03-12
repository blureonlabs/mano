import { z } from "zod";

export const clientSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  full_name: z.string().min(1).max(200),
  email: z.string().email().nullable(),
  phone: z.string().max(20).nullable(),
  date_of_birth: z.string().nullable(),
  emergency_contact: z.string().max(200).nullable(),
  notes_private: z.string().nullable(),
  intake_completed: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createClientSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  emergency_contact: z.string().max(200).nullable().optional(),
  notes_private: z.string().nullable().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type Client = z.infer<typeof clientSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
