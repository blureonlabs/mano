import { router, publicProcedure } from "../trpc";
import { bookSessionSchema, getAvailableSlotsSchema, bookMultipleSessionsSchema } from "@mano/shared";
import type { TimeSlot, SessionType } from "@mano/shared";
import { computeAvailableSlots } from "@mano/domain";
import { TRPCError } from "@trpc/server";

/** Helper: fetch session types from the normalized table, falling back to JSONB */
async function resolveSessionTypes(
  supabase: any,
  therapistId: string,
  jsonbFallback: unknown
): Promise<{ id: string; name: string; duration_mins: number; rate_inr: number; is_active: boolean; description?: string | null; intake_form_id?: string | null; session_type_rates?: { client_category: string; rate_inr: number }[] }[]> {
  const { data: tableTypes } = await supabase
    .from("session_types")
    .select("*, session_type_rates(*)")
    .eq("therapist_id", therapistId)
    .eq("is_active", true)
    .order("sort_order");

  if (tableTypes && tableTypes.length > 0) return tableTypes;

  // Fallback to JSONB on therapists table (for therapists who haven't migrated)
  return ((jsonbFallback ?? []) as SessionType[]).filter((st) => st.is_active);
}

export const bookingRouter = router({
  /** Get available slots for a therapist (PUBLIC — used on booking page) */
  getSlots: publicProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ ctx, input }) => {
      // 1. Get therapist by slug (include min_booking_advance_hours)
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("id, session_duration_mins, buffer_mins, booking_page_active, session_types, min_booking_advance_hours")
        .eq("slug", input.therapist_slug)
        .eq("booking_page_active", true)
        .single();

      if (!therapist) return [];

      // 2. Resolve session type duration (new table first, JSONB fallback)
      const sessionTypes = await resolveSessionTypes(ctx.supabase, therapist.id, therapist.session_types);
      const selectedType = sessionTypes.find(
        (st) => st.id === input.session_type_id
      );
      const durationMins = selectedType?.duration_mins ?? therapist.session_duration_mins;
      const bufferMins = therapist.buffer_mins;

      // 3. Fetch all data in parallel
      const [availRes, bookedRes, blockedRes, recurringRes] = await Promise.all([
        ctx.supabase
          .from("availability")
          .select("*")
          .eq("therapist_id", therapist.id)
          .eq("is_active", true),
        ctx.supabase
          .from("sessions")
          .select("starts_at, ends_at")
          .eq("therapist_id", therapist.id)
          .neq("status", "cancelled")
          .gte("starts_at", `${input.from_date}T00:00:00+05:30`)
          .lte("starts_at", `${input.to_date}T23:59:59+05:30`),
        ctx.supabase
          .from("blocked_slots")
          .select("start_at, end_at")
          .eq("therapist_id", therapist.id)
          .gte("start_at", `${input.from_date}T00:00:00+05:30`)
          .lte("start_at", `${input.to_date}T23:59:59+05:30`),
        ctx.supabase
          .from("recurring_reservations")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("therapist_id", therapist.id)
          .eq("is_active", true),
      ]);

      // 4. Use shared slot calculator (with cutoff + recurring reservations)
      return computeAvailableSlots({
        availability: availRes.data ?? [],
        booked: bookedRes.data ?? [],
        blocked: blockedRes.data ?? [],
        recurringReservations: recurringRes.data ?? [],
        sessionDurationMins: durationMins,
        bufferMins,
        fromDate: input.from_date,
        toDate: input.to_date,
        minAdvanceHours: therapist.min_booking_advance_hours ?? 0,
      });
    }),

  /** Book a session (PUBLIC — called from booking page after payment) */
  book: publicProcedure
    .input(bookSessionSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Get therapist
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("*")
        .eq("slug", input.therapist_slug)
        .single();

      if (!therapist) throw new TRPCError({ code: "NOT_FOUND", message: "Therapist not found" });

      // 2. Resolve session type (new table first, JSONB fallback)
      const sessionTypes = await resolveSessionTypes(ctx.supabase, therapist.id, therapist.session_types);
      const selectedType = sessionTypes.find(
        (st) => st.id === input.session_type_id
      );
      const durationMins = selectedType?.duration_mins ?? therapist.session_duration_mins;
      let rateInr = selectedType?.rate_inr ?? therapist.session_rate_inr;
      const typeName = selectedType?.name ?? null;

      // 2b. Tiered pricing: if client already exists and has a category, use category-specific rate
      // (We check after finding/creating the client below, but pre-compute here for existing clients)

      // 3. Check booking cutoff
      const minAdvanceMs = (therapist.min_booking_advance_hours ?? 0) * 60 * 60_000;
      const slotStart = new Date(input.slot_start);
      if (slotStart.getTime() - Date.now() < minAdvanceMs) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Bookings must be made at least ${therapist.min_booking_advance_hours} hours in advance.`,
        });
      }

      // 4. Check slot still available (prevent double-booking)
      const { data: conflicts } = await ctx.supabase
        .from("sessions")
        .select("id")
        .eq("therapist_id", therapist.id)
        .neq("status", "cancelled")
        .lt("starts_at", input.slot_end)
        .gt("ends_at", input.slot_start);

      if (conflicts && conflicts.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot no longer available" });
      }

      // 5. Find or create client
      let { data: client } = await ctx.supabase
        .from("clients")
        .select("*")
        .eq("therapist_id", therapist.id)
        .eq("email", input.client_email)
        .single();

      if (!client) {
        const { data: newClient } = await ctx.supabase
          .from("clients")
          .insert({
            therapist_id: therapist.id,
            full_name: input.client_name,
            email: input.client_email,
            phone: input.client_phone ?? null,
          })
          .select()
          .single();
        client = newClient;
      }

      // 6. Resolve tiered pricing based on client category
      const clientCategory = client?.category as string | null | undefined;
      if (clientCategory && selectedType?.session_type_rates) {
        const categoryRate = selectedType.session_type_rates.find(
          (r) => r.client_category === clientCategory
        );
        if (categoryRate) rateInr = categoryRate.rate_inr;
      }
      const isFree = rateInr === 0;

      // 7. Get session count for this client
      const { count } = await ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client!.id);

      // 8. Create session (pending approval)
      const { data: session, error } = await ctx.supabase
        .from("sessions")
        .insert({
          therapist_id: therapist.id,
          client_id: client!.id,
          starts_at: input.slot_start,
          ends_at: input.slot_end,
          duration_mins: durationMins,
          status: "pending_approval",
          session_type_name: typeName,
          payment_status: isFree ? "waived" : (input.razorpay_payment_id ? "paid" : "pending"),
          razorpay_payment_id: input.razorpay_payment_id ?? null,
          amount_inr: rateInr,
          session_number: (count ?? 0) + 1,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create booking" });

      // 8. Create intake response if session type has an intake form linked
      const intakeFormId = (selectedType as SessionType & { intake_form_id?: string | null })?.intake_form_id;
      let intakeAccessToken: string | null = null;

      if (intakeFormId) {
        const { data: intakeForm } = await ctx.supabase
          .from("intake_forms")
          .select("fields")
          .eq("id", intakeFormId)
          .eq("status", "active")
          .single();

        if (intakeForm) {
          const { data: intakeResponse } = await ctx.supabase
            .from("intake_responses")
            .insert({
              therapist_id: therapist.id,
              client_id: client!.id,
              intake_form_id: intakeFormId,
              session_id: session!.id,
              form_snapshot: intakeForm.fields,
              status: "pending",
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select("access_token")
            .single();

          intakeAccessToken = intakeResponse?.access_token ?? null;
        }
      }

      return {
        session_id: session!.id,
        zoom_join_url: null as string | null,
        intake_access_token: intakeAccessToken,
      };
    }),

  /** Book multiple sessions at once (PUBLIC — for recurring clients) */
  bookMultiple: publicProcedure
    .input(bookMultipleSessionsSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("*")
        .eq("slug", input.therapist_slug)
        .single();

      if (!therapist) throw new TRPCError({ code: "NOT_FOUND", message: "Therapist not found" });

      // Resolve session types (new table first, JSONB fallback)
      const sessionTypes = await resolveSessionTypes(ctx.supabase, therapist.id, therapist.session_types);
      const selectedType = sessionTypes.find(
        (st) => st.id === input.session_type_id
      );
      const durationMins = selectedType?.duration_mins ?? therapist.session_duration_mins;
      let rateInr = selectedType?.rate_inr ?? therapist.session_rate_inr;
      const typeName = selectedType?.name ?? null;

      // Find or create client
      let { data: client } = await ctx.supabase
        .from("clients")
        .select("*")
        .eq("therapist_id", therapist.id)
        .eq("email", input.client_email)
        .single();

      if (!client) {
        const { data: newClient } = await ctx.supabase
          .from("clients")
          .insert({
            therapist_id: therapist.id,
            full_name: input.client_name,
            email: input.client_email,
            phone: input.client_phone ?? null,
          })
          .select()
          .single();
        client = newClient;
      }

      // Resolve tiered pricing based on client category
      const clientCategory = client?.category as string | null | undefined;
      if (clientCategory && selectedType?.session_type_rates) {
        const categoryRate = selectedType.session_type_rates.find(
          (r) => r.client_category === clientCategory
        );
        if (categoryRate) rateInr = categoryRate.rate_inr;
      }
      const isFree = rateInr === 0;

      const { count: baseCount } = await ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client!.id);

      // Validate all slots are available, then insert them
      const sessions = [];
      for (let i = 0; i < input.slots.length; i++) {
        const slot = input.slots[i]!;

        const { data: conflicts } = await ctx.supabase
          .from("sessions")
          .select("id")
          .eq("therapist_id", therapist.id)
          .neq("status", "cancelled")
          .lt("starts_at", slot.end)
          .gt("ends_at", slot.start);

        if (conflicts && conflicts.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Slot ${i + 1} is no longer available`,
          });
        }

        const { data: session, error } = await ctx.supabase
          .from("sessions")
          .insert({
            therapist_id: therapist.id,
            client_id: client!.id,
            starts_at: slot.start,
            ends_at: slot.end,
            duration_mins: durationMins,
            status: "pending_approval",
            session_type_name: typeName,
            payment_status: isFree ? "waived" : "pending",
            amount_inr: rateInr,
            session_number: (baseCount ?? 0) + i + 1,
          })
          .select()
          .single();

        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create booking" });
        sessions.push(session);
      }

      return {
        session_ids: sessions.map((s) => s!.id),
        count: sessions.length,
      };
    }),
});
