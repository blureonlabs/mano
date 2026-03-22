/**
 * Integration helpers for session lifecycle events.
 * Creates Zoom meetings, Google Calendar events, and sends confirmation emails
 * when sessions are approved or created.
 *
 * All integration calls are best-effort — failures are logged but do not
 * block the session operation.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ZoomClient, GoogleCalendarClient, EmailClient } from "@mano/integrations";
import { decrypt } from "./encryption";

interface SessionIntegrationInput {
  sessionId: string;
  therapistId: string;
  clientName: string;
  clientEmail?: string | null;
  sessionType: string;
  startsAt: string; // ISO datetime
  endsAt: string;
  durationMins: number;
}

interface IntegrationResult {
  zoomJoinUrl?: string;
  zoomMeetingId?: string;
  zoomStartUrl?: string;
  googleEventId?: string;
  emailSent: boolean;
}

/**
 * Decrypt a JSONB token object stored on the therapists table.
 * The token is stored as `{ access_token, refresh_token }` and the values
 * may be individually encrypted strings, or the whole jsonb may be plaintext.
 */
function decryptTokens(
  tokenJson: unknown
): { accessToken: string; refreshToken: string } | null {
  if (!tokenJson || typeof tokenJson !== "object") return null;

  const raw = tokenJson as Record<string, unknown>;
  const accessToken = typeof raw.access_token === "string"
    ? (decrypt(raw.access_token) ?? raw.access_token)
    : null;
  const refreshToken = typeof raw.refresh_token === "string"
    ? (decrypt(raw.refresh_token) ?? raw.refresh_token)
    : null;

  if (!accessToken) return null;
  return { accessToken, refreshToken: refreshToken ?? "" };
}

/**
 * Format an ISO datetime string for display in emails (IST).
 */
function formatForEmail(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);
  const date = dt.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const time = dt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return { date, time };
}

/**
 * Run integrations after a session is approved or created:
 * 1. Create a Zoom meeting (if Zoom is connected)
 * 2. Create a Google Calendar event (if GCal is connected)
 * 3. Send a confirmation email to the client (if email is available)
 *
 * Each step is independent — a failure in one does not affect the others.
 * Zoom/GCal details are persisted back to the session row.
 */
export async function handleSessionIntegrations(
  supabase: SupabaseClient,
  input: SessionIntegrationInput
): Promise<IntegrationResult> {
  const result: IntegrationResult = { emailSent: false };

  // Fetch therapist's integration settings and tokens
  const { data: therapist } = await supabase
    .from("therapists")
    .select(
      "zoom_connected, google_connected, zoom_token, google_calendar_token, full_name, display_name"
    )
    .eq("id", input.therapistId)
    .single();

  if (!therapist) return result;

  // ------------------------------------------------------------------
  // 1. Zoom — create a scheduled meeting
  // ------------------------------------------------------------------
  if (therapist.zoom_connected && therapist.zoom_token) {
    try {
      const tokens = decryptTokens(therapist.zoom_token);
      if (tokens) {
        const zoomClient = new ZoomClient({
          clientId: process.env.ZOOM_CLIENT_ID!,
          clientSecret: process.env.ZOOM_CLIENT_SECRET!,
          redirectUri: process.env.ZOOM_REDIRECT_URI!,
        });

        let accessToken = tokens.accessToken;

        // Proactively refresh the access token so we use a fresh one
        if (tokens.refreshToken) {
          try {
            const refreshed = await zoomClient.refreshToken(tokens.refreshToken);
            accessToken = refreshed.access_token;

            // Persist the new tokens back (encrypted)
            await supabase
              .from("therapists")
              .update({
                zoom_token: {
                  access_token: refreshed.access_token,
                  refresh_token: refreshed.refresh_token,
                },
              })
              .eq("id", input.therapistId);
          } catch {
            // Refresh failed — try with the existing access token
          }
        }

        const meeting = await zoomClient.createMeeting(accessToken, {
          topic: `${input.sessionType} — ${input.clientName}`,
          startTime: input.startsAt,
          durationMins: input.durationMins,
        });

        result.zoomJoinUrl = meeting.join_url;
        result.zoomMeetingId = meeting.id?.toString();
        result.zoomStartUrl = meeting.start_url;

        // Persist Zoom details on the session row
        await supabase
          .from("sessions")
          .update({
            zoom_join_url: meeting.join_url,
            zoom_meeting_id: meeting.id?.toString(),
            zoom_start_url: meeting.start_url,
          })
          .eq("id", input.sessionId);
      }
    } catch (err) {
      console.error("[integration] Failed to create Zoom meeting:", err);
    }
  }

  // ------------------------------------------------------------------
  // 2. Google Calendar — create an event
  // ------------------------------------------------------------------
  if (therapist.google_connected && therapist.google_calendar_token) {
    try {
      const tokens = decryptTokens(therapist.google_calendar_token);
      if (tokens) {
        const gcalClient = new GoogleCalendarClient({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri: process.env.GOOGLE_REDIRECT_URI!,
        });

        let accessToken = tokens.accessToken;

        // Proactively refresh the access token
        if (tokens.refreshToken) {
          try {
            const refreshed = await gcalClient.refreshToken(tokens.refreshToken);
            accessToken = refreshed.access_token;

            // Persist new access token (refresh token doesn't change on GCal refresh)
            await supabase
              .from("therapists")
              .update({
                google_calendar_token: {
                  access_token: refreshed.access_token,
                  refresh_token: tokens.refreshToken,
                },
              })
              .eq("id", input.therapistId);
          } catch {
            // Refresh failed — try with the existing access token
          }
        }

        const event = await gcalClient.createEvent(accessToken, {
          summary: `${input.sessionType} — ${input.clientName}`,
          description: `Session with ${input.clientName}`,
          startTime: input.startsAt,
          endTime: input.endsAt,
          attendeeEmail: input.clientEmail ?? undefined,
          zoomJoinUrl: result.zoomJoinUrl,
        });

        result.googleEventId = event.id;

        // Persist GCal event ID on the session row
        await supabase
          .from("sessions")
          .update({ google_event_id: event.id })
          .eq("id", input.sessionId);
      }
    } catch (err) {
      console.error("[integration] Failed to create Google Calendar event:", err);
    }
  }

  // ------------------------------------------------------------------
  // 3. Email — send booking confirmation to the client
  // ------------------------------------------------------------------
  if (input.clientEmail) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const emailClient = new EmailClient({
          apiKey,
          fromAddress: process.env.EMAIL_FROM ?? "noreply@mano.app",
        });

        const { date, time } = formatForEmail(input.startsAt);
        const therapistName =
          therapist.display_name ?? therapist.full_name ?? "Your Therapist";

        await emailClient.sendBookingConfirmation({
          to: input.clientEmail,
          clientName: input.clientName,
          therapistName,
          sessionDate: date,
          sessionTime: time,
          zoomLink: result.zoomJoinUrl,
        });

        result.emailSent = true;
      }
    } catch (err) {
      console.error("[integration] Failed to send confirmation email:", err);
    }
  }

  return result;
}
