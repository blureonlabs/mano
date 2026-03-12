import type { SupabaseClient } from "@supabase/supabase-js";

export class TherapistRepo {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("therapists")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from("therapists")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("therapists")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
