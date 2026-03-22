import { router, publicProcedure, protectedProcedure } from "../trpc";
import { offsetPaginationSchema } from "@mano/shared";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const clientPortalRouter = router({
  /** Get user role (therapist or client) */
  getUserRole: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.user.id)
      .single();

    return { role: data?.role ?? null };
  }),

  /** Get client profile(s) across all therapists */
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data: clients } = await ctx.supabase
      .from("clients")
      .select("id, full_name, email, phone, status, therapist_id")
      .eq("user_id", ctx.user.id);

    return {
      user_id: ctx.user.id,
      email: ctx.user.email,
      clients: clients ?? [],
    };
  }),

  /** Upcoming sessions for logged-in client */
  upcomingSessions: protectedProcedure.query(async ({ ctx }) => {
    // Get all client records linked to this user
    const { data: clients } = await ctx.supabase
      .from("clients")
      .select("id, therapist_id")
      .eq("user_id", ctx.user.id);

    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map((c) => c.id);

    // Join therapist data directly to avoid a separate query
    const { data: sessions } = await ctx.supabase
      .from("sessions")
      .select("id, starts_at, ends_at, duration_mins, status, session_type_name, amount_inr, therapist_id, therapists(display_name)")
      .in("client_id", clientIds)
      .gte("starts_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true })
      .limit(20);

    if (!sessions || sessions.length === 0) return [];

    return sessions.map((s) => {
      const { therapists, ...rest } = s as typeof s & { therapists: { display_name: string } | null };
      return {
        ...rest,
        therapist_name: therapists?.display_name ?? "Unknown",
      };
    });
  }),

  /** Past sessions with pagination */
  pastSessions: protectedProcedure
    .input(offsetPaginationSchema)
    .query(async ({ ctx, input }) => {
      const { data: clients } = await ctx.supabase
        .from("clients")
        .select("id, therapist_id")
        .eq("user_id", ctx.user.id);

      if (!clients || clients.length === 0) return { sessions: [], hasMore: false };

      const clientIds = clients.map((c) => c.id);

      // Join therapist data directly to avoid a separate query
      const { data: sessions } = await ctx.supabase
        .from("sessions")
        .select("id, starts_at, ends_at, duration_mins, status, session_type_name, amount_inr, therapist_id, therapists(display_name)")
        .in("client_id", clientIds)
        .lt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false })
        .range(input.offset, input.offset + input.limit);

      if (!sessions || sessions.length === 0) return { sessions: [], hasMore: false };

      return {
        sessions: sessions.map((s) => {
          const { therapists, ...rest } = s as typeof s & { therapists: { display_name: string } | null };
          return {
            ...rest,
            therapist_name: therapists?.display_name ?? "Unknown",
          };
        }),
        hasMore: sessions.length === input.limit,
      };
    }),

  /** Pending intake forms for logged-in client */
  pendingIntakeForms: protectedProcedure.query(async ({ ctx }) => {
    const { data: clients } = await ctx.supabase
      .from("clients")
      .select("id")
      .eq("user_id", ctx.user.id);

    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map((c) => c.id);

    const { data: responses } = await ctx.supabase
      .from("intake_responses")
      .select("id, access_token, status, expires_at, intake_form_id")
      .in("client_id", clientIds)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    return responses ?? [];
  }),

  /** Cancel an upcoming session */
  cancelSession: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the session belongs to one of the user's client records
      const { data: clients } = await ctx.supabase
        .from("clients")
        .select("id")
        .eq("user_id", ctx.user.id);

      const clientIds = clients?.map((c) => c.id) ?? [];
      if (clientIds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No client profile found" });
      }

      // Fetch session to verify ownership
      const { data: session } = await ctx.supabase
        .from("sessions")
        .select("id, client_id, starts_at, therapist_id")
        .eq("id", input.session_id)
        .in("client_id", clientIds)
        .single();

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      // Check cancellation policy
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("cancellation_hours")
        .eq("id", session.therapist_id)
        .single();

      const cancellationHours = therapist?.cancellation_hours ?? 24;
      const hoursUntil = (new Date(session.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
      const isLate = hoursUntil <= cancellationHours;

      // Update session
      const { error } = await ctx.supabase
        .from("sessions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "client",
          is_late_cancellation: isLate,
        })
        .eq("id", input.session_id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel session" });
      }

      return { cancelled: true, lateCancellation: isLate };
    }),

  /** Get client details for a specific therapist slug (for booking auto-fill) */
  getForTherapist: protectedProcedure
    .input(z.object({ therapist_slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: therapist } = await ctx.supabase
        .from("therapists")
        .select("id")
        .eq("slug", input.therapist_slug)
        .single();

      if (!therapist) return null;

      const { data: client } = await ctx.supabase
        .from("clients")
        .select("id, full_name, email, phone")
        .eq("therapist_id", therapist.id)
        .eq("user_id", ctx.user.id)
        .single();

      return client ?? null;
    }),
});
