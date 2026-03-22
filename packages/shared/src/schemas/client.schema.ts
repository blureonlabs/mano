import { z } from "zod";

export const clientStatusEnum = z.enum(["active", "inactive", "terminated"]);
export const clientTypeEnum = z.enum(["regular", "irregular"]);
export const clientCategoryEnum = z.enum(["indian", "nri", "couple", "other"]);

export const clientSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  full_name: z.string().min(1).max(200),
  email: z.string().email().nullable(),
  phone: z.string().max(20).nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").nullable(),
  emergency_contact: z.string().max(200).nullable(),
  notes_private: z.string().max(10000).nullable(),
  intake_completed: z.boolean().default(false),
  is_active: z.boolean().default(true),
  status: clientStatusEnum.default("active"),
  client_type: clientTypeEnum.default("irregular"),
  category: clientCategoryEnum.default("indian"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createClientSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").nullable().optional(),
  emergency_contact: z.string().max(200).nullable().optional(),
  notes_private: z.string().max(10000).nullable().optional(),
  status: clientStatusEnum.optional(),
  client_type: clientTypeEnum.optional(),
  category: clientCategoryEnum.optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type Client = z.infer<typeof clientSchema>;
export type ClientStatus = z.infer<typeof clientStatusEnum>;
export type ClientType = z.infer<typeof clientTypeEnum>;
export type ClientCategory = z.infer<typeof clientCategoryEnum>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
