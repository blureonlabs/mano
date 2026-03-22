import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron endpoint: send session reminders for upcoming sessions.
 *
 * Intended to be called by Vercel Cron (or an external scheduler).
 * Finds sessions in the next 24 hours that haven't had a 24-hour
 * reminder sent, dispatches email (and optionally WhatsApp) for each,
 * then marks `reminder_24h_sent = true`.
 *
 * Auth: requires Bearer token matching CRON_SECRET env var.
 */
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role client — cron runs outside any user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60_000);

  // Fetch sessions in the next 24 hours that haven't had reminders sent.
  // Join clients to get contact info. RLS is bypassed via service role.
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      "id, starts_at, session_type_name, therapist_id, client_id, clients(full_name, email, phone)"
    )
    .eq("status", "scheduled")
    .eq("reminder_24h_sent", false)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in24h.toISOString());

  if (error) {
    console.error("[Reminders] Query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0, total: 0 });
  }

  // Lazily import EmailClient only when there's work to do
  const { EmailClient } = await import("@mano/integrations");
  const emailClient = new EmailClient({
    apiKey: process.env.RESEND_API_KEY!,
    fromAddress: process.env.EMAIL_FROM ?? "noreply@mano.app",
  });

  let sent = 0;

  for (const session of sessions) {
    // Supabase returns the joined row as an object (single relationship)
    const client = (session as Record<string, unknown>).clients as {
      full_name: string;
      email: string | null;
      phone: string | null;
    } | null;

    if (!client?.email) continue;

    try {
      // Format date in IST for the reminder
      const sessionDate = new Date(session.starts_at).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      await emailClient.sendSessionReminder({
        to: client.email,
        clientName: client.full_name,
        therapistName: "Your therapist", // Could look up therapist name if needed
        sessionTime: sessionDate,
      });

      // Mark reminder as sent
      await supabase
        .from("sessions")
        .update({ reminder_24h_sent: true })
        .eq("id", session.id);

      sent++;
    } catch (err) {
      console.error(`[Reminders] Failed for session ${session.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: sessions.length });
}
