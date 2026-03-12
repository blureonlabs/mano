import type { SupabaseClient } from "@supabase/supabase-js";

export class MessageService {
  constructor(private supabase: SupabaseClient) {}

  async send(therapistId: string, clientId: string, content: string) {
    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        therapist_id: therapistId,
        client_id: clientId,
        sender_type: "therapist",
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getThread(therapistId: string, clientId: string, limit: number, cursor?: string) {
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

    const hasMore = data && data.length > limit;
    const messages = hasMore ? data.slice(0, -1) : (data ?? []);
    return {
      messages,
      nextCursor: hasMore ? messages[messages.length - 1]?.created_at : null,
    };
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
}
