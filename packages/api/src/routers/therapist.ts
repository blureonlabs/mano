import { router, protectedProcedure } from "../trpc";
import { updateTherapistSchema, setAvailabilitySchema } from "@mano/shared";
import { z } from "zod";

export const therapistRouter = router({
  /** Get the current therapist's profile */
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("therapists")
      .select("*")
      .eq("id", ctx.user.id)
      .single();

    if (error) throw error;
    return data;
  }),

  /** Update therapist profile */
  update: protectedProcedure
    .input(updateTherapistSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("therapists")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Get availability schedule */
  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("availability")
      .select("*")
      .eq("therapist_id", ctx.user.id)
      .order("day_of_week");

    if (error) throw error;
    return data;
  }),

  /** Set availability for a day */
  setAvailability: protectedProcedure
    .input(setAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("availability")
        .upsert(
          {
            therapist_id: ctx.user.id,
            ...input,
          },
          { onConflict: "therapist_id,day_of_week" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Get public profile by slug (for booking page) */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("therapists")
        .select(
          "id, full_name, display_name, slug, bio, qualifications, avatar_url, session_duration_mins, session_rate_inr, booking_page_active"
        )
        .eq("slug", input.slug)
        .eq("booking_page_active", true)
        .single();

      if (error) throw error;
      return data;
    }),
});
