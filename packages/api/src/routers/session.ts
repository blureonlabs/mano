import { router, protectedProcedure } from "../trpc";
import {
  createSessionNoteSchema,
  updateSessionNoteSchema,
  cancelSessionSchema,
} from "@mano/shared";
import { z } from "zod";
import { encrypt, decrypt } from "../utils/encryption";

/** Fields in session_notes that contain clinical data and must be encrypted at rest */
const ENCRYPTED_NOTE_FIELDS = [
  "subjective",
  "objective",
  "assessment",
  "plan",
  "freeform_content",
  "homework",
] as const;

function encryptNoteInput(input: Record<string, unknown>): Record<string, unknown> {
  const result = { ...input };
  for (const field of ENCRYPTED_NOTE_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === "string") {
      result[field] = encrypt(result[field] as string);
    }
  }
  // Encrypt array fields as JSON strings
  if (result.techniques_used != null) {
    result.techniques_used = encrypt(JSON.stringify(result.techniques_used));
  }
  if (result.risk_flags != null) {
    result.risk_flags = encrypt(JSON.stringify(result.risk_flags));
  }
  return result;
}

function decryptNote<T extends Record<string, unknown>>(note: T): T {
  const result = { ...note };
  for (const field of ENCRYPTED_NOTE_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === "string") {
      (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
    }
  }
  // Decrypt array fields back from encrypted JSON strings
  if (result.techniques_used != null && typeof result.techniques_used === "string") {
    try {
      (result as Record<string, unknown>).techniques_used = JSON.parse(decrypt(result.techniques_used as string) ?? "[]");
    } catch { /* leave as-is if not encrypted (legacy data) */ }
  }
  if (result.risk_flags != null && typeof result.risk_flags === "string") {
    try {
      (result as Record<string, unknown>).risk_flags = JSON.parse(decrypt(result.risk_flags as string) ?? "[]");
    } catch { /* leave as-is if not encrypted (legacy data) */ }
  }
  return result;
}

export const sessionRouter = router({
  /** Get sessions pending therapist approval */
  pending: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("therapist_id", ctx.user.id)
      .eq("status", "pending_approval")
      .order("created_at");

    if (error) throw error;
    return data;
  }),

  /** Approve a pending booking request */
  approve: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
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

      if (error) throw error;

      // TODO: Send confirmation email/WhatsApp to client
      return data;
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

      if (error) throw error;

      // TODO: Send rejection notification to client
      return data;
    }),

  /** Get today's sessions for the therapist */
  today: protectedProcedure.query(async ({ ctx }) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await ctx.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("therapist_id", ctx.user.id)
      .gte("starts_at", startOfDay.toISOString())
      .lte("starts_at", endOfDay.toISOString())
      .neq("status", "cancelled")
      .order("starts_at");

    if (error) throw error;
    return data;
  }),

  /** Get upcoming sessions */
  upcoming: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .select("*, clients(full_name, email, phone)")
        .eq("therapist_id", ctx.user.id)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(input.limit);

      if (error) throw error;
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

      if (error) throw error;
      return data;
    }),

  /** Cancel a session */
  cancel: protectedProcedure
    .input(cancelSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "cancelled",
          cancellation_reason: input.reason ?? null,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;

      // TODO: Cancel Zoom meeting, delete Google Calendar event, notify client
      return data;
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

      if (error) throw error;
      return data;
    }),

  /** Create session note (clinical fields encrypted at rest) */
  createNote: protectedProcedure
    .input(createSessionNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const encrypted = encryptNoteInput({ ...input });
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .insert({
          therapist_id: ctx.user.id,
          ...encrypted,
        })
        .select()
        .single();

      if (error) throw error;
      return decryptNote(data);
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
      const encrypted = encryptNoteInput({ ...input.data });
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .update({ ...encrypted, updated_at: new Date().toISOString() })
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return decryptNote(data);
    }),

  /** Get note for a session */
  getNote: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .select("*")
        .eq("session_id", input.session_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
      return data ? decryptNote(data) : null;
    }),

  /** Get note by ID */
  getNoteById: protectedProcedure
    .input(z.object({ note_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .select("*, sessions(starts_at, ends_at, client_id, clients(full_name))")
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error) throw error;
      return decryptNote(data);
    }),

  /** List recent notes */
  listNotes: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        client_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("session_notes")
        .select("*, sessions!inner(starts_at, ends_at, client_id, clients(full_name))")
        .eq("therapist_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (input.client_id) {
        query = query.eq("sessions.client_id", input.client_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((note) => decryptNote(note));
    }),

  /** Delete a note */
  deleteNote: protectedProcedure
    .input(z.object({ note_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("session_notes")
        .delete()
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),
});
