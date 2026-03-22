import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const sessionTypeRouter = router({
  /** List all session types for the current therapist */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("session_types")
      .select("*, session_type_rates(*)")
      .eq("therapist_id", ctx.user.id)
      .order("sort_order");

    if (error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch session types",
      });
    return data ?? [];
  }),

  /** List active session types for a therapist (public, for booking page) */
  listByTherapist: publicProcedure
    .input(z.object({ therapistId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("session_types")
        .select("id, name, duration_mins, rate_inr, description, session_type_rates(*)")
        .eq("therapist_id", input.therapistId)
        .eq("is_active", true)
        .order("sort_order");

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch session types",
        });
      return data ?? [];
    }),

  /** Create a new session type */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        duration_mins: z.number().int().min(15).max(180),
        rate_inr: z.number().int().min(0),
        description: z.string().max(500).nullish(),
        sort_order: z.number().int().min(0).optional(),
        intake_form_id: z.string().uuid().nullish(),
        rates: z
          .array(
            z.object({
              client_category: z.string().min(1).max(50),
              rate_inr: z.number().int().min(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rates, ...typeData } = input;

      const { data, error } = await ctx.supabase
        .from("session_types")
        .insert({ ...typeData, therapist_id: ctx.user.id })
        .select()
        .single();

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session type",
        });

      // Insert tiered rates if provided
      if (rates && rates.length > 0 && data) {
        const { error: ratesError } = await ctx.supabase
          .from("session_type_rates")
          .insert(rates.map((r) => ({ session_type_id: data.id, ...r })));

        if (ratesError)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create session type rates",
          });
      }

      return data;
    }),

  /** Update an existing session type */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        duration_mins: z.number().int().min(15).max(180).optional(),
        rate_inr: z.number().int().min(0).optional(),
        description: z.string().max(500).nullish(),
        is_active: z.boolean().optional(),
        sort_order: z.number().int().min(0).optional(),
        intake_form_id: z.string().uuid().nullish(),
        rates: z
          .array(
            z.object({
              client_category: z.string().min(1).max(50),
              rate_inr: z.number().int().min(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rates, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from("session_types")
        .update(updates)
        .eq("id", id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update session type",
        });

      // Replace rates if provided (delete + re-insert)
      if (rates !== undefined) {
        await ctx.supabase
          .from("session_type_rates")
          .delete()
          .eq("session_type_id", id);

        if (rates.length > 0) {
          const { error: ratesError } = await ctx.supabase
            .from("session_type_rates")
            .insert(rates.map((r) => ({ session_type_id: id, ...r })));

          if (ratesError)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update session type rates",
            });
        }
      }

      return data;
    }),

  /** Delete a session type */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("session_types")
        .delete()
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id);

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete session type",
        });

      return { success: true };
    }),

  /** Reorder session types */
  reorder: protectedProcedure
    .input(
      z.object({
        orders: z.array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update each session type's sort_order
      for (const { id, sort_order } of input.orders) {
        const { error } = await ctx.supabase
          .from("session_types")
          .update({ sort_order })
          .eq("id", id)
          .eq("therapist_id", ctx.user.id);

        if (error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reorder session types",
          });
      }

      return { success: true };
    }),
});
