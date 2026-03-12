import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const integrationRouter = router({
  /** Get integration status for current therapist */
  status: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("therapists")
      .select("zoom_connected, google_connected")
      .eq("id", ctx.user.id)
      .single();

    if (error) throw error;
    return {
      zoom: data?.zoom_connected ?? false,
      google_calendar: data?.google_connected ?? false,
    };
  }),

  /** Start Zoom OAuth flow — returns the authorization URL */
  zoomAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Use @mano/integrations ZoomClient.getAuthUrl()
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/zoom`;
    const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri ?? "")}&state=${ctx.user.id}`;
    return { url };
  }),

  /** Complete Zoom OAuth (exchange code for tokens) */
  connectZoom: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Call @mano/integrations ZoomClient.exchangeCode()
      // Store tokens in therapist record
      const { error } = await ctx.supabase
        .from("therapists")
        .update({
          zoom_connected: true,
          // zoom_access_token, zoom_refresh_token would be stored encrypted
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),

  /** Disconnect Zoom */
  disconnectZoom: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: Revoke Zoom token via @mano/integrations
    const { error } = await ctx.supabase
      .from("therapists")
      .update({
        zoom_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.user.id);

    if (error) throw error;
    return { success: true };
  }),

  /** Start Google Calendar OAuth flow */
  googleAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Use @mano/integrations GoogleCalendarClient.getAuthUrl()
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/calendar.events";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri ?? "")}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${ctx.user.id}`;
    return { url };
  }),

  /** Complete Google OAuth (exchange code for tokens) */
  connectGoogle: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Call @mano/integrations GoogleCalendarClient.exchangeCode()
      const { error } = await ctx.supabase
        .from("therapists")
        .update({
          google_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),

  /** Disconnect Google Calendar */
  disconnectGoogle: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: Revoke Google token via @mano/integrations
    const { error } = await ctx.supabase
      .from("therapists")
      .update({
        google_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.user.id);

    if (error) throw error;
    return { success: true };
  }),
});
