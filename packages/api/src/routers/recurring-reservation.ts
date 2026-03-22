import { router, protectedProcedure } from "../trpc";
import {
  createRecurringReservationSchema,
  updateRecurringReservationSchema,
} from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getTimezoneOffset } from "../utils/timezone";

export const recurringReservationRouter = router({
  /** List all active recurring reservations for the therapist */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("recurring_reservations")
      .select("*, clients(full_name, email)")
      .eq("therapist_id", ctx.user.id)
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time");

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch recurring reservations" });
    return data;
  }),

  /** List reservations for a specific client */
  byClient: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("recurring_reservations")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .eq("is_active", true)
        .order("day_of_week");

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client reservations" });
      return data;
    }),

  /** Create a recurring slot reservation for a regular client */
  create: protectedProcedure
    .input(createRecurringReservationSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for overlapping recurring reservations
      const { data: existing } = await ctx.supabase
        .from("recurring_reservations")
        .select("id, start_time, end_time, clients(full_name)")
        .eq("therapist_id", ctx.user.id)
        .eq("day_of_week", input.day_of_week)
        .eq("is_active", true);

      const overlap = existing?.find((r) => {
        return input.start_time < r.end_time && input.end_time > r.start_time;
      });

      if (overlap) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This time slot is already reserved for another client.",
        });
      }

      const { data, error } = await ctx.supabase
        .from("recurring_reservations")
        .insert({
          therapist_id: ctx.user.id,
          ...input,
        })
        .select("*, clients(full_name, email)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create recurring reservation" });
      return data;
    }),

  /** Update a recurring reservation (deactivate, change time, etc.) */
  update: protectedProcedure
    .input(updateRecurringReservationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("recurring_reservations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("therapist_id", ctx.user.id)
        .select("*, clients(full_name, email)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update recurring reservation" });
      return data;
    }),

  /** Deactivate (release) a recurring reservation */
  release: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("recurring_reservations")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to release recurring reservation" });
      return data;
    }),

  /** Auto-create a session from a recurring reservation for a specific date */
  createSessionFromReservation: protectedProcedure
    .input(z.object({
      reservation_id: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: reservation } = await ctx.supabase
        .from("recurring_reservations")
        .select("*")
        .eq("id", input.reservation_id)
        .eq("therapist_id", ctx.user.id)
        .eq("is_active", true)
        .single();

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found." });
      }

      // Fetch therapist timezone to construct correct datetime strings
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("timezone")
        .eq("id", ctx.user.id)
        .single();

      const offset = getTimezoneOffset(therapist?.timezone ?? "Asia/Kolkata", new Date(`${input.date}T12:00:00Z`));
      const startsAt = `${input.date}T${reservation.start_time}${offset}`;
      const endsAt = `${input.date}T${reservation.end_time}${offset}`;

      // Check for conflicts
      const { data: conflicts } = await ctx.supabase
        .from("sessions")
        .select("id")
        .eq("therapist_id", ctx.user.id)
        .neq("status", "cancelled")
        .lt("starts_at", endsAt)
        .gt("ends_at", startsAt)
        .limit(1);

      if (conflicts && conflicts.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A session already exists at this time." });
      }

      const durationMins = Math.round(
        (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
      );

      const { count } = await ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", reservation.client_id)
        .eq("therapist_id", ctx.user.id);

      const { data: session, error } = await ctx.supabase
        .from("sessions")
        .insert({
          therapist_id: ctx.user.id,
          client_id: reservation.client_id,
          starts_at: startsAt,
          ends_at: endsAt,
          duration_mins: durationMins,
          status: "scheduled",
          session_type_name: reservation.session_type_name,
          payment_status: reservation.amount_inr === 0 ? "waived" : "pending",
          amount_inr: reservation.amount_inr,
          session_number: (count ?? 0) + 1,
          recurring_reservation_id: reservation.id,
        })
        .select("*, clients(full_name, email, phone)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session from reservation" });
      return session;
    }),
});
