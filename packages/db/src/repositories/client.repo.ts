import type { SupabaseClient } from "@supabase/supabase-js";

export class ClientRepo {
  constructor(private supabase: SupabaseClient) {}

  async findByTherapist(therapistId: string) {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    return data;
  }

  async findById(id: string, therapistId: string) {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("therapist_id", therapistId)
      .single();
    if (error) throw error;
    return data;
  }

  async findByEmail(therapistId: string, email: string) {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  async create(fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("clients")
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, therapistId: string, fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("clients")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("therapist_id", therapistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
