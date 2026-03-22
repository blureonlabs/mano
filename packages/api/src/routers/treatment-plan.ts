import { router, protectedProcedure } from "../trpc";
import { createTreatmentPlanSchema, updateTreatmentPlanSchema, treatmentPlanStatusEnum } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { logAudit } from "../utils/audit";
import { clinicalData } from "../utils/clinical";

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

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch treatment plans" });
      return (data ?? []).map((plan) => clinicalData.decryptPlan(plan));
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

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch treatment plan" });
      return clinicalData.decryptPlan(data);
    }),

  /** Create a new treatment plan (clinical fields encrypted at rest) */
  create: protectedProcedure
    .input(createTreatmentPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const encrypted = clinicalData.encryptPlan({ ...input });
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .insert({
          therapist_id: ctx.user.id,
          ...encrypted,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create treatment plan" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "create",
        entity_type: "treatment_plan",
        entity_id: data.id,
      });

      return clinicalData.decryptPlan(data);
    }),

  /** Update a treatment plan (clinical fields encrypted at rest) */
  update: protectedProcedure
    .input(z.object({
      plan_id: z.string().uuid(),
      data: updateTreatmentPlanSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const encrypted = clinicalData.encryptPlan({ ...input.data });
      const { data, error } = await ctx.supabase
        .from("treatment_plans")
        .update({ ...encrypted, updated_at: new Date().toISOString() })
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update treatment plan" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "treatment_plan",
        entity_id: input.plan_id,
      });

      return clinicalData.decryptPlan(data);
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

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update treatment plan status" });
      return data;
    }),

  /** Soft-delete a treatment plan (sets deleted_at, RLS hides from future reads) */
  delete: protectedProcedure
    .input(z.object({ plan_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("treatment_plans")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.plan_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete treatment plan" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "delete",
        entity_type: "treatment_plan",
        entity_id: input.plan_id,
      });

      return { success: true };
    }),
});
