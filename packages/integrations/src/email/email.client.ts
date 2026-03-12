/**
 * Email client (via Resend).
 * Sends booking confirmations, session reminders, and invoices.
 */
export class EmailClient {
  private apiKey: string;
  private fromAddress: string;

  constructor(opts: { apiKey: string; fromAddress?: string }) {
    this.apiKey = opts.apiKey;
    this.fromAddress = opts.fromAddress ?? "noreply@mano.app";
  }

  async send(opts: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<{ id: string }> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) throw new Error(`Resend send email failed: ${res.status}`);
    return res.json();
  }

  async sendBookingConfirmation(opts: {
    to: string;
    clientName: string;
    therapistName: string;
    sessionDate: string;
    sessionTime: string;
    zoomLink?: string;
  }): Promise<{ id: string }> {
    const html = `
      <h2>Booking Confirmed</h2>
      <p>Hi ${opts.clientName},</p>
      <p>Your session with ${opts.therapistName} is confirmed.</p>
      <p><strong>Date:</strong> ${opts.sessionDate}<br/>
         <strong>Time:</strong> ${opts.sessionTime}</p>
      ${opts.zoomLink ? `<p><strong>Join:</strong> <a href="${opts.zoomLink}">${opts.zoomLink}</a></p>` : ""}
      <p>— Mano</p>
    `;
    return this.send({ to: opts.to, subject: `Session confirmed with ${opts.therapistName}`, html });
  }

  async sendSessionReminder(opts: {
    to: string;
    clientName: string;
    therapistName: string;
    sessionTime: string;
    zoomLink?: string;
  }): Promise<{ id: string }> {
    const html = `
      <h2>Session Reminder</h2>
      <p>Hi ${opts.clientName},</p>
      <p>Reminder: Your session with ${opts.therapistName} is at ${opts.sessionTime}.</p>
      ${opts.zoomLink ? `<p><strong>Join:</strong> <a href="${opts.zoomLink}">${opts.zoomLink}</a></p>` : ""}
      <p>— Mano</p>
    `;
    return this.send({ to: opts.to, subject: `Session reminder — ${opts.sessionTime}`, html });
  }
}
