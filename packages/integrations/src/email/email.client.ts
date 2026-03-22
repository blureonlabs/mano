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
    const html = this.wrapInLayout(`
      <h1 style="font-family: 'Lora', Georgia, serif; font-size: 24px; color: #2C2825; margin: 0 0 8px 0;">
        Your Session is Confirmed
      </h1>
      <p style="font-size: 16px; color: #5A5550; margin: 0 0 24px 0;">
        Hi ${opts.clientName}, you're all set.
      </p>

      <div style="background-color: #F5F0E8; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7A756F; width: 100px;">Therapist</td>
            <td style="padding: 6px 0; font-size: 15px; color: #2C2825; font-weight: 600;">${opts.therapistName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7A756F;">Date</td>
            <td style="padding: 6px 0; font-size: 15px; color: #2C2825; font-weight: 600;">${opts.sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7A756F;">Time</td>
            <td style="padding: 6px 0; font-size: 15px; color: #2C2825; font-weight: 600;">${opts.sessionTime}</td>
          </tr>
        </table>
      </div>

      ${opts.zoomLink ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${opts.zoomLink}" style="display: inline-block; background-color: #4A7C6F; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
          Join via Zoom
        </a>
        <p style="font-size: 12px; color: #7A756F; margin-top: 8px;">
          <a href="${opts.zoomLink}" style="color: #7A756F; text-decoration: underline;">${opts.zoomLink}</a>
        </p>
      </div>
      ` : ""}

      <p style="font-size: 14px; color: #5A5550; line-height: 1.6;">
        If you need to reschedule or cancel, please reach out to your therapist at least 36 hours before the session.
      </p>
    `);
    return this.send({ to: opts.to, subject: `Session confirmed with ${opts.therapistName}`, html });
  }

  async sendSessionReminder(opts: {
    to: string;
    clientName: string;
    therapistName: string;
    sessionTime: string;
    zoomLink?: string;
  }): Promise<{ id: string }> {
    const html = this.wrapInLayout(`
      <h1 style="font-family: 'Lora', Georgia, serif; font-size: 24px; color: #2C2825; margin: 0 0 8px 0;">
        Session Reminder
      </h1>
      <p style="font-size: 16px; color: #5A5550; margin: 0 0 24px 0;">
        Hi ${opts.clientName}, just a gentle reminder about your upcoming session.
      </p>

      <div style="background-color: #F5F0E8; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7A756F; width: 100px;">Therapist</td>
            <td style="padding: 6px 0; font-size: 15px; color: #2C2825; font-weight: 600;">${opts.therapistName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #7A756F;">Time</td>
            <td style="padding: 6px 0; font-size: 15px; color: #2C2825; font-weight: 600;">${opts.sessionTime}</td>
          </tr>
        </table>
      </div>

      ${opts.zoomLink ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${opts.zoomLink}" style="display: inline-block; background-color: #4A7C6F; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
          Join via Zoom
        </a>
        <p style="font-size: 12px; color: #7A756F; margin-top: 8px;">
          <a href="${opts.zoomLink}" style="color: #7A756F; text-decoration: underline;">${opts.zoomLink}</a>
        </p>
      </div>
      ` : ""}

      <p style="font-size: 14px; color: #5A5550; line-height: 1.6;">
        We look forward to seeing you. Take a moment to settle in before your session begins.
      </p>
    `);
    return this.send({ to: opts.to, subject: `Session reminder — ${opts.sessionTime}`, html });
  }

  private wrapInLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mano</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2C2825;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background-color: #4A7C6F; padding: 20px 32px; border-radius: 12px 12px 0 0;">
              <span style="font-family: 'Lora', Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                Mano
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #FDFAF5; padding: 32px; border-radius: 0 0 12px 12px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="font-size: 12px; color: #9A958F; margin: 0 0 8px 0;">
                Powered by <span style="color: #4A7C6F; font-weight: 600;">Mano</span> — Practice management for therapists
              </p>
              <p style="font-size: 11px; color: #B0ABA5; margin: 0;">
                <a href="%unsubscribe_url%" style="color: #B0ABA5; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
