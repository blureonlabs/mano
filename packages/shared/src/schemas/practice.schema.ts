import { z } from "zod";

export const practiceRoleEnum = z.enum(["owner", "therapist", "admin"]);
/** Roles that can be assigned/changed — owner is set only at creation */
const assignableRoleEnum = z.enum(["therapist", "admin"]);

export const practiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  owner_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const practiceMemberSchema = z.object({
  id: z.string().uuid(),
  practice_id: z.string().uuid(),
  user_id: z.string().uuid(),
  therapist_id: z.string().uuid().nullable(),
  role: practiceRoleEnum,
  can_view_notes: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export const createPracticeSchema = z.object({
  name: z.string().min(1).max(200),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: assignableRoleEnum,
  can_view_notes: z.boolean().default(false),
});

export const updateMemberSchema = z.object({
  member_id: z.string().uuid(),
  role: assignableRoleEnum.optional(),
  can_view_notes: z.boolean().optional(),
});

export type Practice = z.infer<typeof practiceSchema>;
export type PracticeMember = z.infer<typeof practiceMemberSchema>;
export type PracticeRole = z.infer<typeof practiceRoleEnum>;
export type CreatePracticeInput = z.infer<typeof createPracticeSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
