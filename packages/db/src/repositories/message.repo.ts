import type { SupabaseClient } from "@supabase/supabase-js";

export class MessageRepo {
  constructor(private supabase: SupabaseClient) {}

  async findByThread(therapistId: string, clientId: string, limit: number, cursor?: string) {
    let query = this.supabase
      .from("messages")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(fields: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("messages")
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markRead(therapistId: string, clientId: string) {
    const { error } = await this.supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("therapist_id", therapistId)
      .eq("client_id", clientId)
      .eq("sender_type", "client")
      .is("read_at", null);
    if (error) throw error;
  }

  async getUnreadCounts(therapistId: string) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("client_id")
      .eq("therapist_id", therapistId)
      .eq("sender_type", "client")
      .is("read_at", null);
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const msg of data ?? []) {
      counts[msg.client_id] = (counts[msg.client_id] ?? 0) + 1;
    }
    return counts;
  }
}
