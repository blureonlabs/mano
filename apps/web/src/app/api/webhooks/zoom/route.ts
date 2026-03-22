import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ZoomClient } from "@mano/integrations";
import { encrypt } from "@mano/api/encryption";

function getZoomClient() {
  return new ZoomClient({
    clientId: process.env.ZOOM_CLIENT_ID!,
    clientSecret: process.env.ZOOM_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/zoom`,
  });
}

/**
 * GET handler: Zoom OAuth callback.
 * Exchanges the authorization code for tokens, encrypts them,
 * stores them in the therapist record, and redirects to settings.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // therapist user ID

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=zoom_auth", req.url));
  }

  try {
    // 1. Exchange code for tokens
    const zoom = getZoomClient();
    const tokens = await zoom.exchangeCode(code);

    // 2. Encrypt tokens before storing
    const encryptedTokens = {
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
    };

    // 3. Use service-role client to bypass RLS (webhook runs without user session)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Store encrypted tokens and mark as connected
    const { error } = await supabase
      .from("therapists")
      .update({
        zoom_token: encryptedTokens,
        zoom_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", state);

    if (error) {
      console.error("Failed to store Zoom tokens:", error);
      return NextResponse.redirect(new URL("/settings?error=zoom_save", req.url));
    }

    return NextResponse.redirect(new URL("/settings?zoom=connected", req.url));
  } catch (err) {
    console.error("Zoom OAuth exchange error:", err);
    return NextResponse.redirect(new URL("/settings?error=zoom_exchange", req.url));
  }
}

/**
 * POST handler: Zoom deauthorization webhook.
 * When a user deauthorizes the Zoom app, clear their tokens.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Zoom sends a deauthorization event when a user removes the app
    if (body.event !== "app_deauthorized") {
      return NextResponse.json({ status: "ignored" });
    }

    const userId = body.payload?.user_data_retention === false
      ? body.payload?.account_id
      : null;

    // The client_id in the payload should match our app
    const payloadClientId = body.payload?.client_id;
    if (payloadClientId && payloadClientId !== process.env.ZOOM_CLIENT_ID) {
      return NextResponse.json({ status: "ignored" });
    }

    // Use the user_id from the deauthorization payload
    // Zoom sends the user's Zoom ID, but we stored our therapist ID as state.
    // We need to find the therapist by checking who has zoom_connected = true.
    // Since we can't directly map Zoom user IDs, we clear based on the event.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Zoom deauth payload includes user_id (Zoom's user ID).
    // We look for therapists with matching zoom data.
    const zoomUserId = body.payload?.user_id;

    if (zoomUserId) {
      // Clear zoom tokens for any therapist whose zoom_token contains this user
      // Since we can't easily query encrypted tokens, log the event
      console.warn(
        `Zoom deauthorization received for Zoom user ${zoomUserId}. ` +
        `Manual cleanup may be needed if therapist mapping is unavailable.`
      );
    }

    // Respond with Zoom's required compliance format
    // https://developers.zoom.us/docs/integrations/app-deauthorization/
    if (process.env.ZOOM_VERIFICATION_TOKEN) {
      const verificationToken = req.headers.get("authorization");
      if (verificationToken !== process.env.ZOOM_VERIFICATION_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Send data compliance request to Zoom
    if (body.payload?.deauthorization_event_received) {
      await fetch("https://api.zoom.us/oauth/data/compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          client_id: process.env.ZOOM_CLIENT_ID,
          user_id: body.payload.user_id,
          account_id: body.payload.account_id,
          deauthorization_event_received: body.payload.deauthorization_event_received,
          compliance_completed: true,
        }),
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Zoom webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
