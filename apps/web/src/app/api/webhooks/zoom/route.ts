import { NextResponse } from "next/server";

/**
 * Zoom OAuth callback / webhook handler.
 * Handles OAuth code exchange and deauthorization events.
 * TODO: Implement with @mano/integrations ZoomClient
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // therapist user ID

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=zoom_auth", req.url));
  }

  // TODO: Exchange code for tokens via @mano/integrations ZoomClient
  return NextResponse.redirect(new URL("/settings?zoom=connected", req.url));
}

export async function POST(req: Request) {
  // TODO: Handle Zoom deauthorization webhook
  return NextResponse.json({ received: true });
}
