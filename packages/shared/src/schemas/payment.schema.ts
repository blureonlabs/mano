import { z } from "zod";

export const invoiceStatusEnum = z.enum(["unpaid", "paid", "refunded"]);

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  therapist_id: z.string().uuid(),
  client_id: z.string().uuid(),
  session_id: z.string().uuid().nullable(),
  invoice_number: z.string(),
  amount_inr: z.number().int(), // paise
  gst_amount_inr: z.number().int().default(0),
  total_inr: z.number().int(),
  status: invoiceStatusEnum.default("unpaid"),
  razorpay_payment_id: z.string().nullable(),
  razorpay_order_id: z.string().nullable(),
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  amount_inr: z.number().int().min(100), // min ₹1
  gst_percentage: z.number().min(0).max(28).default(0),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
