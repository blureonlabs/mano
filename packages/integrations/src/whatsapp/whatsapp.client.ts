/**
 * WhatsApp Business API client (via Gupshup or similar provider).
 * Sends session reminders and booking confirmations.
 */
export class WhatsAppClient {
  private apiKey: string;
  private sourcePhone: string;

  constructor(opts: { apiKey: string; sourcePhone: string }) {
    this.apiKey = opts.apiKey;
    this.sourcePhone = opts.sourcePhone;
  }

  async sendTemplateMessage(opts: {
    to: string;
    templateId: string;
    params: string[];
  }): Promise<{ messageId: string }> {
    // TODO: Implement with Gupshup/Meta WhatsApp Business API
    // This is a placeholder for the integration
    console.log(`[WhatsApp] Sending template ${opts.templateId} to ${opts.to}`);
    return { messageId: `wa_${Date.now()}` };
  }

  async sendSessionReminder(opts: {
    to: string;
    therapistName: string;
    sessionDate: string;
    sessionTime: string;
    zoomLink?: string;
  }): Promise<{ messageId: string }> {
    return this.sendTemplateMessage({
      to: opts.to,
      templateId: "session_reminder",
      params: [opts.therapistName, opts.sessionDate, opts.sessionTime, opts.zoomLink ?? ""],
    });
  }

  async sendBookingConfirmation(opts: {
    to: string;
    therapistName: string;
    sessionDate: string;
    sessionTime: string;
  }): Promise<{ messageId: string }> {
    return this.sendTemplateMessage({
      to: opts.to,
      templateId: "booking_confirmation",
      params: [opts.therapistName, opts.sessionDate, opts.sessionTime],
    });
  }
}
