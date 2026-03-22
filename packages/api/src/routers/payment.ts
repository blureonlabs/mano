import { router, protectedProcedure, practiceProcedure } from "../trpc";
import { createInvoiceSchema, paginationSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getAccessibleTherapistIds, applyTherapistScope } from "../utils/practice-scope";

export const paymentRouter = router({
  /** List invoices for the current therapist / practice */
  list: practiceProcedure
    .input(
      paginationSchema.extend({
        client_id: z.string().uuid().optional(),
        status: z.enum(["unpaid", "paid", "refunded"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("invoices")
        .select("*, clients(full_name, email)")
        .order("created_at", { ascending: false });

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      if (input.client_id) query = query.eq("client_id", input.client_id);
      if (input.status) query = query.eq("status", input.status);
      query = query.limit(input.limit);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch invoices" });
      return data;
    }),

  /** Create an invoice */
  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const gstAmount = Math.round(
        input.amount_inr * ((input.gst_percentage ?? 0) / 100)
      );
      const total = input.amount_inr + gstAmount;

      // Generate invoice number: MANO-YYYYMM-XXXX
      const now = new Date();
      const prefix = `MANO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { count } = await ctx.supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", ctx.user.id);

      const invoiceNumber = `${prefix}-${String((count ?? 0) + 1).padStart(4, "0")}`;

      const { data, error } = await ctx.supabase
        .from("invoices")
        .insert({
          therapist_id: ctx.user.id,
          client_id: input.client_id,
          session_id: input.session_id ?? null,
          invoice_number: invoiceNumber,
          amount_inr: input.amount_inr,
          gst_amount_inr: gstAmount,
          total_inr: total,
          status: "unpaid",
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create invoice" });
      return data;
    }),

  /** Mark invoice as paid (called after Razorpay webhook confirms payment) */
  markPaid: protectedProcedure
    .input(
      z.object({
        invoice_id: z.string().uuid(),
        razorpay_payment_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("invoices")
        .update({
          status: "paid",
          razorpay_payment_id: input.razorpay_payment_id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", input.invoice_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update invoice payment status" });
      return data;
    }),

  /** Create a Razorpay order for an invoice */
  createOrder: protectedProcedure
    .input(z.object({ invoice_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: invoice, error } = await ctx.supabase
        .from("invoices")
        .select("*")
        .eq("id", input.invoice_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch invoice" });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      // TODO: Call @mano/integrations RazorpayClient.createOrder()
      // For now, return a placeholder
      return {
        invoice_id: invoice.id,
        amount: invoice.total_inr,
        currency: "INR",
        razorpay_order_id: null as string | null,
      };
    }),
});
