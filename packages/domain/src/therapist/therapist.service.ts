import type { SupabaseClient } from "@supabase/supabase-js";

export class TherapistService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(therapistId: string) {
    const { data, error } = await this.supabase
      .from("therapists")
      .select("*")
      .eq("id", therapistId)
      .single();
    if (error) throw error;
    return data;
  }

  async getPublicProfile(slug: string) {
    const { data, error } = await this.supabase
      .from("therapists")
      .select("id, full_name, display_name, slug, bio, qualifications, avatar_url, session_duration_mins, session_rate_inr, booking_page_active")
      .eq("slug", slug)
      .eq("booking_page_active", true)
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(therapistId: string, fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("therapists")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", therapistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
