import { router, publicProcedure } from "../trpc";
import { bookSessionSchema, getAvailableSlotsSchema } from "@mano/shared";
import type { TimeSlot } from "@mano/shared";

export const bookingRouter = router({
  /** Get available slots for a therapist (PUBLIC — used on booking page) */
  getSlots: publicProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ ctx, input }) => {
      // 1. Get therapist by slug
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("id, session_duration_mins, buffer_mins, booking_page_active")
        .eq("slug", input.therapist_slug)
        .eq("booking_page_active", true)
        .single();

      if (!therapist) return [];

      // 2. Get availability rules
      const { data: availability } = await ctx.supabase
        .from("availability")
        .select("*")
        .eq("therapist_id", therapist.id)
        .eq("is_active", true);

      // 3. Get booked sessions in range
      const { data: booked } = await ctx.supabase
        .from("sessions")
        .select("starts_at, ends_at")
        .eq("therapist_id", therapist.id)
        .neq("status", "cancelled")
        .gte("starts_at", `${input.from_date}T00:00:00+05:30`)
        .lte("starts_at", `${input.to_date}T23:59:59+05:30`);

      // 4. Get blocked slots
      const { data: blocked } = await ctx.supabase
        .from("blocked_slots")
        .select("start_at, end_at")
        .eq("therapist_id", therapist.id)
        .gte("start_at", `${input.from_date}T00:00:00+05:30`)
        .lte("start_at", `${input.to_date}T23:59:59+05:30`);

      // 5. Compute available slots
      // TODO: Move to @mano/domain SlotCalculator for proper business logic
      const slots: TimeSlot[] = [];
      const slotDuration = therapist.session_duration_mins + therapist.buffer_mins;

      const fromDate = new Date(`${input.from_date}T00:00:00+05:30`);
      const toDate = new Date(`${input.to_date}T23:59:59+05:30`);

      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dayRules = availability?.find((a) => a.day_of_week === dayOfWeek);
        if (!dayRules) continue;

        const dayStr = d.toISOString().split("T")[0];
        const [startH, startM] = dayRules.start_time.split(":").map(Number);
        const [endH, endM] = dayRules.end_time.split(":").map(Number);

        let cursor = new Date(`${dayStr}T${dayRules.start_time}+05:30`);
        const dayEnd = new Date(`${dayStr}T${dayRules.end_time}+05:30`);

        while (cursor.getTime() + therapist.session_duration_mins * 60000 <= dayEnd.getTime()) {
          const slotEnd = new Date(cursor.getTime() + therapist.session_duration_mins * 60000);

          const isBooked = booked?.some(
            (s) => new Date(s.starts_at) < slotEnd && new Date(s.ends_at) > cursor
          );
          const isBlocked = blocked?.some(
            (b) => new Date(b.start_at) < slotEnd && new Date(b.end_at) > cursor
          );
          const isPast = cursor <= new Date();

          if (!isBooked && !isBlocked && !isPast) {
            slots.push({
              start: cursor.toISOString(),
              end: slotEnd.toISOString(),
            });
          }

          cursor = new Date(cursor.getTime() + slotDuration * 60000);
        }
      }

      return slots;
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

      if (!therapist) throw new Error("Therapist not found");

      // 2. Check slot still available (prevent double-booking)
      const { data: conflicts } = await ctx.supabase
        .from("sessions")
        .select("id")
        .eq("therapist_id", therapist.id)
        .neq("status", "cancelled")
        .lt("starts_at", input.slot_end)
        .gt("ends_at", input.slot_start);

      if (conflicts && conflicts.length > 0) {
        throw new Error("Slot no longer available");
      }

      // 3. Find or create client
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

      // 4. Get session count for this client
      const { count } = await ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client!.id);

      // 5. Create Zoom meeting (if therapist has Zoom connected)
      let zoomJoinUrl: string | null = null;
      let zoomStartUrl: string | null = null;
      let zoomMeetingId: string | null = null;

      if (therapist.zoom_connected) {
        // TODO: Call @mano/integrations ZoomClient.createMeeting()
      }

      // 6. Create Google Calendar event (if connected)
      let googleEventId: string | null = null;
      if (therapist.google_connected) {
        // TODO: Call @mano/integrations GoogleCalendarClient.createEvent()
      }

      // 7. Create session (pending approval — therapist must approve)
      const { data: session, error } = await ctx.supabase
        .from("sessions")
        .insert({
          therapist_id: therapist.id,
          client_id: client!.id,
          starts_at: input.slot_start,
          ends_at: input.slot_end,
          duration_mins: therapist.session_duration_mins,
          status: "pending_approval",
          zoom_meeting_id: zoomMeetingId,
          zoom_join_url: zoomJoinUrl,
          zoom_start_url: zoomStartUrl,
          google_event_id: googleEventId,
          payment_status: input.razorpay_payment_id ? "paid" : "pending",
          razorpay_payment_id: input.razorpay_payment_id ?? null,
          amount_inr: therapist.session_rate_inr,
          session_number: (count ?? 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // 8. Send confirmations
      // TODO: Call @mano/integrations EmailClient + WhatsAppClient

      return {
        session_id: session!.id,
        zoom_join_url: zoomJoinUrl,
      };
    }),
});
