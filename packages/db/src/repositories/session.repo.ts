import type { SupabaseClient } from "@supabase/supabase-js";

export class SessionRepo {
  constructor(private supabase: SupabaseClient) {}

  async findToday(therapistId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("therapist_id", therapistId)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .neq("status", "cancelled")
      .order("starts_at");
    if (error) throw error;
    return data;
  }

  async findUpcoming(therapistId: string, limit: number) {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("therapist_id", therapistId)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async findByClient(therapistId: string, clientId: string) {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("client_id", clientId)
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async create(fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("sessions")
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, therapistId: string, fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("sessions")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("therapist_id", therapistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async countByClient(clientId: string) {
    const { count, error } = await this.supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);
    if (error) throw error;
    return count ?? 0;
  }
}
