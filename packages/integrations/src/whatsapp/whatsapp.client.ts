/**
 * WhatsApp Business API client via Gupshup.
 * Sends session reminders, booking confirmations, and broadcast messages.
 *
 * Gupshup docs: https://docs.gupshup.io/docs/send-whatsapp-message
 */

interface WhatsAppConfig {
  apiKey: string;
  apiUrl?: string;
  sourcePhone: string;
}

interface GupshupResponse {
  status: string;
  messageId?: string;
  id?: string;
  message?: string;
}

export class WhatsAppClient {
  private apiKey: string;
  private apiUrl: string;
  private sourcePhone: string;

  constructor(config: WhatsAppConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl ?? "https://api.gupshup.io/wa/api/v1";
    this.sourcePhone = config.sourcePhone;
  }

  /**
   * Send a template message (for notifications outside the 24h session window).
   * Template must be pre-approved in the Gupshup dashboard.
   */
  async sendTemplateMessage(opts: {
    to: string;
    templateId: string;
    params: string[];
  }): Promise<{ messageId: string }> {
    const body = new URLSearchParams({
      source: this.sourcePhone,
      destination: this.normalizePhone(opts.to),
      template: JSON.stringify({
        id: opts.templateId,
        params: opts.params,
      }),
    });

    const res = await fetch(`${this.apiUrl}/template/msg`, {
      method: "POST",
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gupshup API error (${res.status}): ${text}`);
    }

    const data: GupshupResponse = await res.json();

    if (data.status === "error") {
      throw new Error(`Gupshup API error: ${data.message ?? "Unknown error"}`);
    }

    return { messageId: data.messageId ?? data.id ?? "unknown" };
  }

  /**
   * Send a session (free-form text) message.
   * Only works within the 24h window after the client's last message.
   */
  async sendSessionMessage(opts: {
    to: string;
    message: string;
  }): Promise<{ messageId: string }> {
    const body = new URLSearchParams({
      source: this.sourcePhone,
      destination: this.normalizePhone(opts.to),
      message: JSON.stringify({
        type: "text",
        text: opts.message,
      }),
    });

    const res = await fetch(`${this.apiUrl}/msg`, {
      method: "POST",
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gupshup API error (${res.status}): ${text}`);
    }

    const data: GupshupResponse = await res.json();

    if (data.status === "error") {
      throw new Error(`Gupshup API error: ${data.message ?? "Unknown error"}`);
    }

    return { messageId: data.messageId ?? data.id ?? "unknown" };
  }

  /**
   * Send session reminder via pre-approved template.
   */
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

  /**
   * Send booking confirmation via pre-approved template.
   */
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

  /**
   * Normalize phone number to E.164 format for India.
   * Strips spaces/dashes, prepends 91 country code if missing.
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, "");

    // If starts with 0, remove leading zero (Indian local format)
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    // If 10 digits, assume Indian number — prepend 91
    if (digits.length === 10) {
      digits = `91${digits}`;
    }

    return digits;
  }
}
