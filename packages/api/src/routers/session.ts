import { router, protectedProcedure } from "../trpc";
import {
  createSessionNoteSchema,
  updateSessionNoteSchema,
  cancelSessionSchema,
} from "@mano/shared";
import { z } from "zod";

export const sessionRouter = router({
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

  /** Create session note */
  createNote: protectedProcedure
    .input(createSessionNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .insert({
          therapist_id: ctx.user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update session note */
  updateNote: protectedProcedure
    .input(
      z.object({
        note_id: z.string().uuid(),
        data: updateSessionNoteSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("session_notes")
        .update({ ...input.data, updated_at: new Date().toISOString() })
        .eq("id", input.note_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      return data;
    }),
});
