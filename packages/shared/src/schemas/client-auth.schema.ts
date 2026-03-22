import { z } from "zod";

export const clientSignupSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().max(20).optional(),
});

export const clientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type ClientSignupInput = z.infer<typeof clientSignupSchema>;
export type ClientLoginInput = z.infer<typeof clientLoginSchema>;
