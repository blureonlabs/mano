import { router, protectedProcedure } from "../trpc";
import { sendMessageSchema } from "@mano/shared";
import { z } from "zod";

export const messageRouter = router({
  /** Get messages for a client (paginated) */
  list: protectedProcedure
    .input(
      z.object({
        client_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().datetime().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("messages")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .order("created_at", { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor) {
        query = query.lt("created_at", input.cursor);
      }

      const { data, error } = await query;
      if (error) throw error;

      const hasMore = data && data.length > input.limit;
      const messages = hasMore ? data.slice(0, -1) : (data ?? []);

      return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1]?.created_at : null,
      };
    }),

  /** Send a message to a client */
  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("messages")
        .insert({
          therapist_id: ctx.user.id,
          client_id: input.client_id,
          sender_type: "therapist",
          content: input.content,
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send via WhatsApp/Email using @mano/integrations

      return data;
    }),

  /** Mark messages as read */
  markRead: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .eq("sender_type", "client")
        .is("read_at", null);

      if (error) throw error;
      return { success: true };
    }),

  /** Get unread message count per client */
  unreadCounts: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("messages")
      .select("client_id")
      .eq("therapist_id", ctx.user.id)
      .eq("sender_type", "client")
      .is("read_at", null);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const msg of data ?? []) {
      counts[msg.client_id] = (counts[msg.client_id] ?? 0) + 1;
    }
    return counts;
  }),
});
