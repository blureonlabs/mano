import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createBlockedSlotSchema,
  updateBlockedSlotSchema,
  deleteBlockedSlotSchema,
  listBlockedSlotsSchema,
} from "@mano/shared";

export const blockedSlotRouter = router({
  /** List blocked slots within a date range */
  list: protectedProcedure
    .input(listBlockedSlotsSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("blocked_slots")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .gte("start_at", input.from)
        .lte("start_at", input.to)
        .order("start_at");

      if (error) throw error;
      return data;
    }),

  /** Create a blocked slot (break) */
  create: protectedProcedure
    .input(createBlockedSlotSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for overlapping sessions (not cancelled)
      const { data: overlapping } = await ctx.supabase
        .from("sessions")
        .select("id")
        .eq("therapist_id", ctx.user.id)
        .neq("status", "cancelled")
        .lt("starts_at", input.end_at)
        .gt("ends_at", input.start_at)
        .limit(1);

      if (overlapping && overlapping.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This break overlaps with an existing session." });
      }

      const { data, error } = await ctx.supabase
        .from("blocked_slots")
        .insert({
          therapist_id: ctx.user.id,
          start_at: input.start_at,
          end_at: input.end_at,
          reason: input.reason ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update a blocked slot (edit timing/reason) */
  update: protectedProcedure
    .input(updateBlockedSlotSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for overlapping sessions (not cancelled)
      const { data: overlapping } = await ctx.supabase
        .from("sessions")
        .select("id")
        .eq("therapist_id", ctx.user.id)
        .neq("status", "cancelled")
        .lt("starts_at", input.end_at)
        .gt("ends_at", input.start_at)
        .limit(1);

      if (overlapping && overlapping.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This break overlaps with an existing session." });
      }

      // Check for overlapping other blocked slots (exclude self)
      const { data: overlappingBlocks } = await ctx.supabase
        .from("blocked_slots")
        .select("id")
        .eq("therapist_id", ctx.user.id)
        .neq("id", input.id)
        .lt("start_at", input.end_at)
        .gt("end_at", input.start_at)
        .limit(1);

      if (overlappingBlocks && overlappingBlocks.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This break overlaps with another break." });
      }

      const { data, error } = await ctx.supabase
        .from("blocked_slots")
        .update({
          start_at: input.start_at,
          end_at: input.end_at,
          reason: input.reason ?? null,
        })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Delete a blocked slot */
  delete: protectedProcedure
    .input(deleteBlockedSlotSchema)
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("blocked_slots")
        .delete()
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),
});
