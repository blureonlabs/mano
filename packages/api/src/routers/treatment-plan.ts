import { router, protectedProcedure } from "../trpc";
import { createTreatmentPlanSchema, updateTreatmentPlanSchema, treatmentPlanStatusEnum } from "@mano/shared";
import { z } from "zod";
import { encrypt, decrypt, encryptJSON, decryptJSON } from "../utils/encryption";

/** Fields in treatment_plans that contain clinical text and must be encrypted at rest */
const ENCRYPTED_TEXT_FIELDS = ["presenting_concerns", "diagnosis", "notes"] as const;

function encryptPlanInput(input: Record<string, unknown>): Record<string, unknown> {
  const result = { ...input };
  for (const field of ENCRYPTED_TEXT_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === "string") {
      result[field] = encrypt(result[field] as string);
    }
  }
  // Encrypt goals (JSONB array) as an encrypted JSON string
  if (result.goals != null) {
    result.goals = encryptJSON(result.goals);
  }
  return result;
}

function decryptPlan<T extends Record<string, unknown>>(plan: T): T {
  const result = { ...plan };
  for (const field of ENCRYPTED_TEXT_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === "string") {
      (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
    }
  }
  // Decrypt goals back from encrypted JSON string
  if (result.goals != null && typeof result.goals === "string") {
    try {
      (result as Record<string, unknown>).goals = decryptJSON(result.goals as string) ?? [];
    } catch { /* leave as-is if not encrypted (legacy data) */ }
  }
  return result;
}

export const treatmentPlanRouter = router({
  /** List treatment plans for a client (clinical fields decrypted) */
  list: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((plan) => decryptPlan(plan));
    }),

  /** Get a single treatment plan (clinical fields decrypted) */
  getById: protectedProcedure
    .input(z.object({ plan_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .select("*, clients(full_name)")
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error) throw error;
      return decryptPlan(data);
    }),

  /** Create a new treatment plan (clinical fields encrypted at rest) */
  create: protectedProcedure
    .input(createTreatmentPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const encrypted = encryptPlanInput({ ...input });
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .insert({
          therapist_id: ctx.user.id,
          ...encrypted,
        })
        .select()
        .single();

      if (error) throw error;
      return decryptPlan(data);
    }),

  /** Update a treatment plan (clinical fields encrypted at rest) */
  update: protectedProcedure
    .input(z.object({
      plan_id: z.string().uuid(),
      data: updateTreatmentPlanSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const encrypted = encryptPlanInput({ ...input.data });
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .update({ ...encrypted, updated_at: new Date().toISOString() })
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return decryptPlan(data);
    }),

  /** Update plan status */
  updateStatus: protectedProcedure
    .input(z.object({
      plan_id: z.string().uuid(),
      status: treatmentPlanStatusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Delete a treatment plan */
  delete: protectedProcedure
    .input(z.object({ plan_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("treatment_plans")
        .delete()
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),
});
