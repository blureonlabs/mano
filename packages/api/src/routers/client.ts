import { router, protectedProcedure } from "../trpc";
import { createClientSchema, updateClientSchema } from "@mano/shared";
import { z } from "zod";

export const clientRouter = router({
  /** List all clients for the current therapist */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("clients")
      .select("*")
      .eq("therapist_id", ctx.user.id)
      .eq("is_active", true)
      .order("full_name");

    if (error) throw error;
    return data;
  }),

  /** Get a single client by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .select("*")
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error) throw error;
      return data;
    }),

  /** Create a new client */
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .insert({
          therapist_id: ctx.user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update an existing client */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateClientSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .update({ ...input.data, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Deactivate a client (soft delete) */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),
});
