import { router, protectedProcedure } from "../trpc";
import { sendMessageSchema, paginationSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { logAudit } from "../utils/audit";
import { clinicalData } from "../utils/clinical";

export const messageRouter = router({
  /** Get messages for a client (paginated, content decrypted) */
  list: protectedProcedure
    .input(
      paginationSchema.extend({
        client_id: z.string().uuid(),
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
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch messages" });

      const hasMore = data && data.length > input.limit;
      const raw = hasMore ? data.slice(0, -1) : (data ?? []);
      const messages = raw.map((msg) => clinicalData.decryptMessage(msg));

      return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1]?.created_at : null,
      };
    }),

  /** Send a message to a client (content encrypted at rest) */
  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const encrypted = clinicalData.encryptMessage({ content: input.content });
      const { data, error } = await ctx.supabase
        .from("messages")
        .insert({
          therapist_id: ctx.user.id,
          client_id: input.client_id,
          sender_type: "therapist",
          ...encrypted,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send message" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "create",
        entity_type: "message",
        entity_id: (data as Record<string, unknown>).id as string,
      });

      // TODO: Send via WhatsApp/Email using @mano/integrations

      return clinicalData.decryptMessage(data as Record<string, unknown>);
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

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark messages as read" });
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

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch unread message counts" });

    const counts: Record<string, number> = {};
    for (const msg of data ?? []) {
      counts[msg.client_id] = (counts[msg.client_id] ?? 0) + 1;
    }
    return counts;
  }),
});
