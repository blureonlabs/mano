import { z } from "zod";

// ─── Field type enum ───────────────────────────────────────
export const intakeFieldTypeEnum = z.enum([
  "text",
  "textarea",
  "select",
  "multi_select",
  "date",
  "yes_no",
  "heading",
  "consent",
]);

export type IntakeFieldType = z.infer<typeof intakeFieldTypeEnum>;

// ─── Single field definition ───────────────────────────────
export const intakeFieldSchema = z.object({
  id: z.string().uuid(),
  type: intakeFieldTypeEnum,
  label: z.string().min(1).max(500),
  placeholder: z.string().max(200).nullable().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string().max(200)).max(20).nullable().optional(),
  agreement_text: z.string().max(5000).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export type IntakeField = z.infer<typeof intakeFieldSchema>;

// ─── Form template statuses ───────────────────────────────
export const intakeFormStatusEnum = z.enum(["draft", "active", "archived"]);

// ─── Form template ────────────────────────────────────────
export const intakeFormSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).nullable(),
  form_type: z.string().min(1).max(50),
  status: intakeFormStatusEnum,
  fields: z.array(intakeFieldSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type IntakeForm = z.infer<typeof intakeFormSchema>;

// ─── Create / Update input schemas ─────────────────────────
export const createIntakeFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
  form_type: z.string().min(1).max(50).default("individual"),
  status: intakeFormStatusEnum.default("draft"),
  fields: z.array(intakeFieldSchema).min(1).max(50),
});

export const updateIntakeFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  form_type: z.string().min(1).max(50).optional(),
  status: intakeFormStatusEnum.optional(),
  fields: z.array(intakeFieldSchema).min(1).max(50).optional(),
});

export type CreateIntakeFormInput = z.infer<typeof createIntakeFormSchema>;
export type UpdateIntakeFormInput = z.infer<typeof updateIntakeFormSchema>;

// ─── Response status ───────────────────────────────────────
export const intakeResponseStatusEnum = z.enum(["pending", "submitted"]);

// ─── Single field response ─────────────────────────────────
export const intakeFieldResponseSchema = z.object({
  field_id: z.string().uuid(),
  value: z.union([
    z.string(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
});

export type IntakeFieldResponse = z.infer<typeof intakeFieldResponseSchema>;

// ─── Submit intake form (public) ───────────────────────────
export const submitIntakeResponseSchema = z.object({
  access_token: z.string().uuid(),
  responses: z.array(intakeFieldResponseSchema),
});

export type SubmitIntakeResponseInput = z.infer<typeof submitIntakeResponseSchema>;

// ─── Response record ───────────────────────────────────────
export const intakeResponseSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  client_id: z.string().uuid(),
  intake_form_id: z.string().uuid(),
  session_id: z.string().uuid().nullable(),
  access_token: z.string().uuid(),
  status: intakeResponseStatusEnum,
  form_snapshot: z.array(intakeFieldSchema),
  submitted_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type IntakeResponse = z.infer<typeof intakeResponseSchema>;
