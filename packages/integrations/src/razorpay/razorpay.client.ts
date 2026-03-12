import crypto from "crypto";

/**
 * Razorpay payment client.
 * Creates orders and verifies webhook signatures.
 */
export class RazorpayClient {
  private keyId: string;
  private keySecret: string;

  constructor(opts: { keyId: string; keySecret: string }) {
    this.keyId = opts.keyId;
    this.keySecret = opts.keySecret;
  }

  async createOrder(opts: {
    amountPaise: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ id: string; amount: number; currency: string }> {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: opts.amountPaise,
        currency: opts.currency ?? "INR",
        receipt: opts.receipt,
        notes: opts.notes ?? {},
      }),
    });
    if (!res.ok) throw new Error(`Razorpay create order failed: ${res.status}`);
    return res.json();
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  }

  verifyPaymentSignature(opts: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const payload = `${opts.orderId}|${opts.paymentId}`;
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(opts.signature)
    );
  }
}
