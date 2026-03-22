/**
 * Lightweight async job dispatcher for Vercel serverless.
 *
 * Jobs execute as fire-and-forget promises — they run in the same
 * process but are NOT awaited by the caller, so tRPC handlers return
 * immediately while side-effects (email, WhatsApp, etc.) complete in
 * the background.
 *
 * When the app moves to a dedicated queue (Inngest, Trigger.dev, etc.),
 * only this file needs to change — call-sites stay the same.
 */

export type JobType =
  | "send-email"
  | "send-whatsapp"
  | "create-zoom-meeting"
  | "create-gcal-event"
  | "send-session-reminder"
  | "process-webhook";

interface JobPayload {
  type: JobType;
  data: Record<string, unknown>;
}

/**
 * Enqueue a background job. The job runs asynchronously in-process;
 * failures are logged but never propagated to the caller.
 */
export function enqueueJob(type: JobType, data: Record<string, unknown>): void {
  const job: JobPayload = { type, data };

  processJob(job).catch((err) => {
    console.error(`[Job ${type}] Failed:`, err);
  });
}

/**
 * Process a single job. Exported for direct use in cron routes where
 * you may want to await completion.
 */
export async function processJob(job: JobPayload): Promise<void> {
  const { type, data } = job;

  switch (type) {
    case "send-email": {
      const { EmailClient } = await import("@mano/integrations");
      const client = new EmailClient({
        apiKey: process.env.RESEND_API_KEY!,
        fromAddress: process.env.EMAIL_FROM ?? "noreply@mano.app",
      });
      await client.send({
        to: data.to as string,
        subject: data.subject as string,
        html: data.html as string,
        replyTo: data.replyTo as string | undefined,
      });
      break;
    }

    case "send-whatsapp": {
      const { WhatsAppClient } = await import("@mano/integrations");
      const client = new WhatsAppClient({
        apiKey: process.env.WHATSAPP_API_KEY!,
        sourcePhone: process.env.WHATSAPP_SOURCE_PHONE!,
      });
      await client.sendTemplateMessage({
        to: data.to as string,
        templateId: data.templateId as string,
        params: data.params as string[],
      });
      break;
    }

    case "send-session-reminder": {
      // Compose and dispatch an email reminder (and optionally WhatsApp)
      const emailJob = processJob({
        type: "send-email",
        data: {
          to: data.email as string,
          subject: `Session Reminder — ${data.sessionType ?? "Therapy Session"}`,
          html: [
            `<h2>Session Reminder</h2>`,
            `<p>Hi ${data.clientName},</p>`,
            `<p>Reminder: your session is on <strong>${data.sessionDate}</strong>.</p>`,
            `<p>— Mano</p>`,
          ].join(""),
        },
      });

      if (data.phone) {
        const whatsappJob = processJob({
          type: "send-whatsapp",
          data: {
            to: data.phone as string,
            templateId: "session_reminder",
            params: [data.clientName as string, data.sessionDate as string],
          },
        });
        await Promise.allSettled([emailJob, whatsappJob]);
      } else {
        await emailJob;
      }
      break;
    }

    default:
      console.warn(`[Job] Unknown job type: ${type}`);
  }
}
