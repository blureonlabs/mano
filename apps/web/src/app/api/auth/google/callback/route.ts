import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleCalendarClient } from "@mano/integrations";
import { encrypt } from "@mano/api/encryption";

function getGoogleClient() {
  return new GoogleCalendarClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  });
}

/**
 * GET handler: Google Calendar OAuth callback.
 * Exchanges the authorization code for tokens, encrypts them,
 * stores them in the therapist record, and redirects to settings.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // therapist user ID

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=google_auth", req.url));
  }

  try {
    // 1. Exchange code for tokens
    const gcal = getGoogleClient();
    const tokens = await gcal.exchangeCode(code);

    // 2. Encrypt tokens before storing
    const encryptedTokens = {
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
    };

    // 3. Use service-role client to bypass RLS (callback runs without user session)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Store encrypted tokens and mark as connected
    const { error } = await supabase
      .from("therapists")
      .update({
        google_calendar_token: encryptedTokens,
        google_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", state);

    if (error) {
      console.error("Failed to store Google Calendar tokens:", error);
      return NextResponse.redirect(new URL("/settings?error=google_save", req.url));
    }

    return NextResponse.redirect(new URL("/settings?google=connected", req.url));
  } catch (err) {
    console.error("Google Calendar OAuth exchange error:", err);
    return NextResponse.redirect(new URL("/settings?error=google_exchange", req.url));
  }
}
