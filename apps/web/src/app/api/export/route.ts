import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json"; // json or csv
  const entity = url.searchParams.get("entity"); // clients, sessions, invoices

  // Fetch based on entity type — no clinical notes content (encrypted, stays private)
  let data;
  switch (entity) {
    case "clients": {
      const { data: clients } = await supabase
        .from("clients")
        .select("full_name, email, phone, status, client_type, category, date_of_birth, created_at")
        .eq("therapist_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      data = clients;
      break;
    }
    case "sessions": {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("starts_at, ends_at, status, payment_status, session_type_name, duration_mins, clients(full_name)")
        .eq("therapist_id", user.id)
        .is("deleted_at", null)
        .order("starts_at", { ascending: false });
      data = sessions;
      break;
    }
    case "invoices": {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("invoice_number, total_inr, gst_amount_inr, status, paid_at, created_at, clients(full_name)")
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: false });
      data = invoices;
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid entity. Use: clients, sessions, invoices" }, { status: 400 });
  }

  if (format === "csv") {
    // Convert to CSV
    if (!data || data.length === 0) {
      return new Response("No data", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    const firstRow = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow);
    const csvRows = [
      headers.join(","),
      ...data.map(row =>
        headers.map(h => {
          const val = (row as Record<string, unknown>)[h];
          const str = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    return new Response(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${entity}_export_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  }

  return NextResponse.json({ data, exported_at: new Date().toISOString(), count: data?.length ?? 0 });
}
