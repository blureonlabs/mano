import { router, protectedProcedure } from "../trpc";
import { createTreatmentPlanSchema, updateTreatmentPlanSchema, treatmentPlanStatusEnum } from "@mano/shared";
import { z } from "zod";

export const treatmentPlanRouter = router({
  /** List treatment plans for a client */
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
      return data;
    }),

  /** Get a single treatment plan */
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
      return data;
    }),

  /** Create a new treatment plan */
  create: protectedProcedure
    .input(createTreatmentPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .insert({
          therapist_id: ctx.user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update a treatment plan */
  update: protectedProcedure
    .input(z.object({
      plan_id: z.string().uuid(),
      data: updateTreatmentPlanSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .update({ ...input.data, updated_at: new Date().toISOString() })
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
