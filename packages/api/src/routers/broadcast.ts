import { router, protectedProcedure } from "../trpc";
import { sendBroadcastSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { logAudit } from "../utils/audit";
import { enqueueJob } from "../utils/jobs";

export const broadcastRouter = router({
  /** Send a broadcast message to selected clients via WhatsApp/email */
  send: protectedProcedure
    .input(sendBroadcastSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch client contact info
      const { data: clients, error } = await ctx.supabase
        .from("clients")
        .select("id, full_name, email, phone")
        .eq("therapist_id", ctx.user.id)
        .in("id", input.client_ids);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch clients for broadcast" });
      if (!clients || clients.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No clients found." });
      }

      const results = {
        email_sent: 0,
        email_failed: 0,
        whatsapp_sent: 0,
        whatsapp_failed: 0,
      };

      for (const client of clients) {
        // Send email (fire-and-forget via job dispatcher)
        if ((input.channel === "email" || input.channel === "both") && client.email) {
          enqueueJob("send-email", {
            to: client.email,
            subject: input.subject ?? "Message from your therapist",
            html: `<p>Hi ${client.full_name},</p><p>${input.message}</p><p>— Your therapist</p>`,
          });
          results.email_sent++;
        }

        // Send WhatsApp (fire-and-forget via job dispatcher)
        if ((input.channel === "whatsapp" || input.channel === "both") && client.phone) {
          enqueueJob("send-whatsapp", {
            to: client.phone,
            templateId: "broadcast_message",
            params: [client.full_name, input.message],
          });
          results.whatsapp_sent++;
        }
      }

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "create",
        entity_type: "broadcast",
        changes: { recipient_count: clients.length, channel: input.channel },
      });

      return {
        total_clients: clients.length,
        ...results,
      };
    }),
});
