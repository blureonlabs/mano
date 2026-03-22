import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RazorpayClient } from "@mano/integrations";

const razorpay = new RazorpayClient({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // 1. Verify signature
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = razorpay.verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Razorpay webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse the event
    const event = JSON.parse(body);
    const eventType: string = event.event;

    // 3. Create service-role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Idempotency — check if we already processed this payment/order
    const paymentEntity = event.payload?.payment?.entity;
    const idempotencyKey = paymentEntity?.id ?? event.payload?.refund?.entity?.id;

    if (idempotencyKey) {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id, razorpay_payment_id")
        .eq("razorpay_payment_id", idempotencyKey)
        .limit(1);

      // For payment.captured/authorized — if already marked paid, skip
      if (
        (eventType === "payment.authorized" || eventType === "payment.captured") &&
        existingInvoice &&
        existingInvoice.length > 0
      ) {
        return NextResponse.json({ status: "already_processed" });
      }
    }

    // 5. Handle payment events
    if (eventType === "payment.authorized" || eventType === "payment.captured") {
      const payment = paymentEntity;
      const orderId: string = payment.order_id;
      const paymentId: string = payment.id;

      // Update invoice status to paid
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          status: "paid" as const,
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", orderId);

      if (invoiceError) {
        console.error("Failed to update invoice:", invoiceError);
      }

      // Update linked session payment status
      const { data: invoice } = await supabase
        .from("invoices")
        .select("session_id")
        .eq("razorpay_order_id", orderId)
        .single();

      if (invoice?.session_id) {
        await supabase
          .from("sessions")
          .update({ payment_status: "paid" as const })
          .eq("id", invoice.session_id);
      }
    } else if (eventType === "payment.failed") {
      // Note: invoice_status enum only has 'unpaid', 'paid', 'refunded'.
      // A failed payment stays 'unpaid' — log the failure for debugging.
      const payment = paymentEntity;
      const orderId: string | undefined = payment?.order_id;
      if (orderId) {
        console.warn(
          `Razorpay payment failed for order ${orderId}:`,
          payment?.error_code,
          payment?.error_description
        );
      }
    } else if (eventType === "refund.processed") {
      const refund = event.payload.refund.entity;
      const paymentId: string = refund.payment_id;

      // Mark invoice as refunded
      await supabase
        .from("invoices")
        .update({ status: "refunded" as const })
        .eq("razorpay_payment_id", paymentId);

      // Mark session payment as refunded
      await supabase
        .from("sessions")
        .update({ payment_status: "refunded" as const })
        .eq("razorpay_payment_id", paymentId);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
