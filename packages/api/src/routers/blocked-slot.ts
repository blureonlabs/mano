import { router, protectedProcedure } from "../trpc";
import {
  createBlockedSlotSchema,
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
