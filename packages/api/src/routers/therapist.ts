import { router, publicProcedure, protectedProcedure } from "../trpc";
import { updateTherapistSchema, setAvailabilitySchema, updateSessionTypesSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const therapistRouter = router({
  /** Get the current therapist's profile */
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("therapists")
      .select("id, full_name, display_name, slug, bio, qualifications, phone, avatar_url, timezone, session_duration_mins, buffer_mins, session_rate_inr, booking_page_active, cancellation_policy, late_policy, rescheduling_policy, cancellation_hours, min_booking_advance_hours, no_show_charge_percent, late_cancel_charge_percent, session_types, custom_tags, gstin, google_connected, zoom_connected, practice_id, created_at, updated_at")
      .eq("id", ctx.user.id)
      .single();

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch therapist profile" });
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
        .select("id, full_name, display_name, slug, bio, qualifications, phone, avatar_url, timezone, session_duration_mins, buffer_mins, session_rate_inr, booking_page_active, cancellation_policy, late_policy, rescheduling_policy, cancellation_hours, min_booking_advance_hours, no_show_charge_percent, late_cancel_charge_percent, session_types, custom_tags, gstin, google_connected, zoom_connected, practice_id, created_at, updated_at")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update therapist profile" });
      return data;
    }),

  /** Get availability schedule */
  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("availability")
      .select("*")
      .eq("therapist_id", ctx.user.id)
      .order("day_of_week");

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch availability" });
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

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to set availability" });
      return data;
    }),

  /** Update session types configuration */
  updateSessionTypes: protectedProcedure
    .input(updateSessionTypesSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("therapists")
        .update({
          session_types: input.session_types,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update session types" });
      return data;
    }),

  /** Get public profile by slug (for booking page) */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("therapists")
        .select(
          "id, full_name, display_name, slug, bio, qualifications, avatar_url, session_duration_mins, session_rate_inr, buffer_mins, booking_page_active, cancellation_policy, late_policy, rescheduling_policy, cancellation_hours, min_booking_advance_hours, session_types"
        )
        .eq("slug", input.slug)
        .eq("booking_page_active", true)
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch therapist by slug" });
      return data;
    }),
});
