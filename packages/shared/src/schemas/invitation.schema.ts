import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["therapist", "admin"]),
  can_view_notes: z.boolean().default(false),
});

export const acceptInvitationSchema = z.object({
  token: z.string().uuid(),
});

export const revokeInvitationSchema = z.object({
  invitation_id: z.string().uuid(),
});

export const createOnboardingTokenSchema = z.object({
  label: z.string().max(200).optional(),
  max_uses: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
});

export const toggleOnboardingTokenSchema = z.object({
  token_id: z.string().uuid(),
  is_active: z.boolean(),
});

export const clientOnboardingSchema = z.object({
  token: z.string().uuid(),
  full_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  password: z.string().min(6).max(100),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
export type CreateOnboardingTokenInput = z.infer<typeof createOnboardingTokenSchema>;
export type ToggleOnboardingTokenInput = z.infer<typeof toggleOnboardingTokenSchema>;
export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;
