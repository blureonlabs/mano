import { router, protectedProcedure, practiceProcedure, clinicalProcedure } from "../trpc";
import {
  createSessionNoteSchema,
  updateSessionNoteSchema,
  cancelSessionSchema,
  paginationSchema,
} from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { handleSessionIntegrations } from "../utils/integration-helpers";
import { logAudit } from "../utils/audit";
import { clinicalData } from "../utils/clinical";
import { getAccessibleTherapistIds, applyTherapistScope } from "../utils/practice-scope";

export const sessionRouter = router({
  /** Get sessions pending therapist approval */
  pending: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("therapist_id", ctx.user.id)
      .eq("status", "pending_approval")
      .order("created_at");

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch pending sessions" });
    return data;
  }),

  /** Approve a pending booking request */
  approve: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the session with client details for overlap check + integrations
      const { data: session } = await ctx.supabase
        .from("sessions")
        .select("starts_at, ends_at, duration_mins, session_type_name, client_id, clients(full_name, email)")
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .eq("status", "pending_approval")
        .single();

      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found or already processed." });

      // Check for overlapping scheduled sessions (exclude this one) — head:true avoids transferring row data
      const { count: overlapCount } = await ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", ctx.user.id)
        .neq("id", input.session_id)
        .neq("status", "cancelled")
        .neq("status", "pending_approval")
        .lt("starts_at", session.ends_at)
        .gt("ends_at", session.starts_at);

      if (overlapCount && overlapCount > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Cannot approve — this time slot now conflicts with another session." });
      }

      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to approve session" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "session",
        entity_id: input.session_id,
        changes: { status: "scheduled" },
      });

      // Wire integrations: Zoom meeting, Google Calendar event, confirmation email.
      // Best-effort — failures here do not block the approval.
      const clientData = session.clients as unknown;
      // Supabase returns joined rows as an array or object depending on the relation
      const client = Array.isArray(clientData)
        ? (clientData[0] as { full_name: string; email: string | null } | undefined) ?? null
        : (clientData as { full_name: string; email: string | null } | null);
      const durationMins = session.duration_mins ?? Math.round(
        (new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000
      );

      try {
        const integrationResult = await handleSessionIntegrations(ctx.supabase, {
          sessionId: input.session_id,
          therapistId: ctx.user.id,
          clientName: client?.full_name ?? "Client",
          clientEmail: client?.email,
          sessionType: session.session_type_name ?? "Therapy Session",
          startsAt: session.starts_at,
          endsAt: session.ends_at,
          durationMins,
        });

        return {
          ...data,
          zoom_join_url: integrationResult.zoomJoinUrl ?? data.zoom_join_url ?? null,
          zoom_meeting_id: integrationResult.zoomMeetingId ?? data.zoom_meeting_id ?? null,
          google_event_id: integrationResult.googleEventId ?? data.google_event_id ?? null,
        };
      } catch {
        // Integration failure should never block the approval
        return data;
      }
    }),

  /** Reject a pending booking request */
  reject: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "cancelled",
          cancellation_reason: input.reason ?? "Booking request declined",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .eq("status", "pending_approval")
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reject session" });

      // TODO: Send rejection notification to client
      return data;
    }),

  /** Get today's sessions for the therapist / practice */
  today: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(
      ctx.supabase,
      ctx.user.id,
      ctx.practice
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = ctx.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .gte("starts_at", startOfDay.toISOString())
      .lte("starts_at", endOfDay.toISOString())
      .neq("status", "cancelled")
      .order("starts_at");

    query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

    const { data, error } = await query;
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch today's sessions" });
    return data;
  }),

  /** Get upcoming sessions */
  upcoming: practiceProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("sessions")
        .select("*, clients(full_name, email, phone)")
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(input.limit);

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch upcoming sessions" });
      return data;
    }),

  /** Get all sessions within a date range (for calendar view) */
  listByDateRange: practiceProcedure
    .input(z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("sessions")
        .select("*, clients(full_name, email, phone)")
        .gte("starts_at", input.from)
        .lte("starts_at", input.to)
        .order("starts_at");

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch sessions by date range" });
      return data;
    }),

  /** Manually create a session (walk-in, phone, etc.) */
  create: protectedProcedure
    .input(z.object({
      client_id: z.string().uuid(),
      session_type_id: z.string().uuid().optional(),
      starts_at: z.string().datetime(),
      ends_at: z.string().datetime(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Run all pre-checks in parallel: session overlap, block overlap, therapist config, session count
      const [sessionOverlapRes, blockOverlapRes, therapistRes, countRes] = await Promise.all([
        // 1. Check for overlapping sessions (head:true = no row data)
        ctx.supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", ctx.user.id)
          .neq("status", "cancelled")
          .lt("starts_at", input.ends_at)
          .gt("ends_at", input.starts_at),
        // 2. Check for overlapping blocked slots
        ctx.supabase
          .from("blocked_slots")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", ctx.user.id)
          .lt("start_at", input.ends_at)
          .gt("end_at", input.starts_at),
        // 3. Resolve session type for duration/rate
        ctx.supabase
          .from("therapists")
          .select("session_duration_mins, session_rate_inr, session_types")
          .eq("id", ctx.user.id)
          .single(),
        // 4. Get session number for this client
        ctx.supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("client_id", input.client_id)
          .eq("therapist_id", ctx.user.id),
      ]);

      if (sessionOverlapRes.count && sessionOverlapRes.count > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This time slot overlaps with an existing session." });
      }

      if (blockOverlapRes.count && blockOverlapRes.count > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This time slot overlaps with a blocked break." });
      }

      const therapist = therapistRes.data;
      const sessionTypes = (therapist?.session_types ?? []) as {
        id: string; name: string; duration_mins: number; rate_inr: number;
      }[];
      const selectedType = input.session_type_id
        ? sessionTypes.find((st) => st.id === input.session_type_id)
        : null;

      const durationMins = Math.round(
        (new Date(input.ends_at).getTime() - new Date(input.starts_at).getTime()) / 60000
      );
      const rateInr = selectedType?.rate_inr ?? therapist?.session_rate_inr ?? 0;
      const typeName = selectedType?.name ?? null;

      const count = countRes.count;

      // Insert as "scheduled" directly (therapist-created = auto-approved)
      const { data, error } = await ctx.supabase
        .from("sessions")
        .insert({
          therapist_id: ctx.user.id,
          client_id: input.client_id,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          duration_mins: durationMins,
          status: "scheduled",
          session_type_name: typeName,
          payment_status: rateInr === 0 ? "waived" : "pending",
          amount_inr: rateInr,
          session_number: (count ?? 0) + 1,
        })
        .select("*, clients(full_name, email, phone)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session" });
      return data;
    }),

  /** Reschedule a session (update timing) */
  reschedule: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
      starts_at: z.string().datetime(),
      ends_at: z.string().datetime(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session exists and belongs to therapist
      const { data: session } = await ctx.supabase
        .from("sessions")
        .select("id, status")
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });
      if (session.status === "cancelled" || session.status === "completed" || session.status === "no_show") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reschedule a session that is already completed, cancelled, or no-show." });
      }

      // Check for overlapping sessions and blocked slots in parallel (head:true = no row data)
      const [sessionOverlapRes, blockOverlapRes] = await Promise.all([
        ctx.supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", ctx.user.id)
          .neq("id", input.session_id)
          .neq("status", "cancelled")
          .lt("starts_at", input.ends_at)
          .gt("ends_at", input.starts_at),
        ctx.supabase
          .from("blocked_slots")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", ctx.user.id)
          .lt("start_at", input.ends_at)
          .gt("end_at", input.starts_at),
      ]);

      if (sessionOverlapRes.count && sessionOverlapRes.count > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "New time overlaps with an existing session." });
      }

      if (blockOverlapRes.count && blockOverlapRes.count > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "New time overlaps with a blocked break." });
      }

      const durationMins = Math.round(
        (new Date(input.ends_at).getTime() - new Date(input.starts_at).getTime()) / 60000
      );

      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          duration_mins: durationMins,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .select("*, clients(full_name, email, phone)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reschedule session" });
      return data;
    }),

  /** Soft-delete a session (sets deleted_at, RLS hides from future reads) */
  delete: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("sessions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete session" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "delete",
        entity_type: "session",
        entity_id: input.session_id,
      });

      return { success: true };
    }),

  /** Mark a session as no-show */
  markNoShow: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "no_show",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark session as no-show" });
      return data;
    }),

  /** Get sessions for a specific client */
  byClient: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .order("starts_at", { ascending: false });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client sessions" });
      return data;
    }),

  /** Cancel a session (with late cancellation detection) */
  cancel: protectedProcedure
    .input(cancelSessionSchema.extend({
      cancelled_by: z.enum(["therapist", "client"]).default("therapist"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch session and therapist cancellation policy in parallel
      const [sessionRes, therapistRes] = await Promise.all([
        ctx.supabase
          .from("sessions")
          .select("starts_at, status")
          .eq("id", input.session_id)
          .eq("therapist_id", ctx.user.id)
          .single(),
        ctx.supabase
          .from("therapists")
          .select("cancellation_hours, late_cancel_charge_percent")
          .eq("id", ctx.user.id)
          .single(),
      ]);

      const session = sessionRes.data;
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found." });

      const therapist = therapistRes.data;

      const cancellationHours = therapist?.cancellation_hours ?? 24;
      const sessionStart = new Date(session.starts_at).getTime();
      const hoursUntil = (sessionStart - Date.now()) / (1000 * 60 * 60);
      const isLate = input.cancelled_by === "client" && hoursUntil <= cancellationHours;

      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "cancelled",
          cancellation_reason: input.reason ?? null,
          cancelled_at: new Date().toISOString(),
          cancelled_by: input.cancelled_by,
          is_late_cancellation: isLate,
          payment_status: isLate ? "pending" : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel session" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "session",
        entity_id: input.session_id,
        changes: { status: "cancelled", reason: input.reason ?? null },
      });

      // TODO: Cancel Zoom meeting, delete Google Calendar event, notify client
      return { ...data, is_late_cancellation: isLate };
    }),

  /** Mark session as completed */
  complete: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete session" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "session",
        entity_id: input.session_id,
        changes: { status: "completed" },
      });

      return data;
    }),

  /** Create session note (clinical fields encrypted at rest) */
  createNote: protectedProcedure
    .input(createSessionNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const encrypted = clinicalData.encryptNote({ ...input });
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .insert({
          therapist_id: ctx.user.id,
          ...encrypted,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session note" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "create",
        entity_type: "session_note",
        entity_id: data.id,
      });

      return clinicalData.decryptNote(data);
    }),

  /** Update session note (clinical fields encrypted at rest) */
  updateNote: protectedProcedure
    .input(
      z.object({
        note_id: z.string().uuid(),
        data: updateSessionNoteSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const encrypted = clinicalData.encryptNote({ ...input.data });
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .update({ ...encrypted, updated_at: new Date().toISOString() })
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update session note" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "session_note",
        entity_id: input.note_id,
      });

      return clinicalData.decryptNote(data);
    }),

  /** Get note for a session (requires clinical notes access) */
  getNote: clinicalProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("session_notes")
        .select("*")
        .eq("session_id", input.session_id);

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch session note" }); // PGRST116 = not found
      return data ? clinicalData.decryptNote(data) : null;
    }),

  /** Get note by ID (requires clinical notes access) */
  getNoteById: clinicalProcedure
    .input(z.object({ note_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("session_notes")
        .select("*, sessions(starts_at, ends_at, client_id, clients(full_name))")
        .eq("id", input.note_id);

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      const { data, error } = await query.single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch session note" });
      return clinicalData.decryptNote(data);
    }),

  /** List recent notes (requires clinical notes access) */
  listNotes: clinicalProcedure
    .input(
      paginationSchema.extend({
        client_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("session_notes")
        .select("*, sessions!inner(starts_at, ends_at, client_id, clients(full_name))")
        .order("created_at", { ascending: false })
        .limit(input.limit);

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      if (input.client_id) {
        query = query.eq("sessions.client_id", input.client_id);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch session notes" });
      return (data ?? []).map((note) => clinicalData.decryptNote(note));
    }),

  /** Soft-delete a note (sets deleted_at, RLS hides from future reads) */
  deleteNote: protectedProcedure
    .input(z.object({ note_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("session_notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete session note" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "delete",
        entity_type: "session_note",
        entity_id: input.note_id,
      });

      return { success: true };
    }),
});
