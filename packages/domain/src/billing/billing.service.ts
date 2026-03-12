import type { SupabaseClient } from "@supabase/supabase-js";

export class BillingService {
  constructor(private supabase: SupabaseClient) {}

  async createInvoice(therapistId: string, opts: {
    clientId: string;
    sessionId?: string;
    amountInr: number;
    gstPercentage?: number;
  }) {
    const gstAmount = Math.round(opts.amountInr * ((opts.gstPercentage ?? 0) / 100));
    const total = opts.amountInr + gstAmount;

    // Generate invoice number
    const now = new Date();
    const prefix = `MANO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { count } = await this.supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("therapist_id", therapistId);

    const invoiceNumber = `${prefix}-${String((count ?? 0) + 1).padStart(4, "0")}`;

    const { data, error } = await this.supabase
      .from("invoices")
      .insert({
        therapist_id: therapistId,
        client_id: opts.clientId,
        session_id: opts.sessionId ?? null,
        invoice_number: invoiceNumber,
        amount_inr: opts.amountInr,
        gst_amount_inr: gstAmount,
        total_inr: total,
        status: "unpaid",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markPaid(invoiceId: string, therapistId: string, razorpayPaymentId: string) {
    const { data, error } = await this.supabase
      .from("invoices")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("therapist_id", therapistId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
