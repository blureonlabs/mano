import type { SupabaseClient } from "@supabase/supabase-js";

export class ClientService {
  constructor(private supabase: SupabaseClient) {}

  async findOrCreate(therapistId: string, opts: { email: string; fullName: string; phone?: string }) {
    // Try to find existing client
    const { data: existing } = await this.supabase
      .from("clients")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("email", opts.email)
      .single();

    if (existing) return existing;

    // Create new client
    const { data, error } = await this.supabase
      .from("clients")
      .insert({
        therapist_id: therapistId,
        full_name: opts.fullName,
        email: opts.email,
        phone: opts.phone ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async list(therapistId: string) {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    return data;
  }
}
