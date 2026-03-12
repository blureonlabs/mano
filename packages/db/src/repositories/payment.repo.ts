import type { SupabaseClient } from "@supabase/supabase-js";

export class PaymentRepo {
  constructor(private supabase: SupabaseClient) {}

  async findByTherapist(therapistId: string, filters?: { clientId?: string; status?: string }) {
    let query = this.supabase
      .from("invoices")
      .select("*, clients(full_name, email)")
      .eq("therapist_id", therapistId)
      .order("created_at", { ascending: false });

    if (filters?.clientId) query = query.eq("client_id", filters.clientId);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("invoices")
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, therapistId: string, fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("invoices")
      .update(fields)
      .eq("id", id)
      .eq("therapist_id", therapistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async countByTherapist(therapistId: string) {
    const { count, error } = await this.supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("therapist_id", therapistId);
    if (error) throw error;
    return count ?? 0;
  }
}
