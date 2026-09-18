import { z } from "zod";

export const transactionTypeSchema = z.enum(["SALE", "PURCHASE"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const paymentStatusSchema = z.enum(["PAID", "PARTIAL", "UNPAID"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const transactionItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  qty: z.number(),
  unitPrice: z.number(),
  subtotal: z.number(),
  product: z.object({ id: z.string(), name: z.string() }).optional(),
});
export type TransactionItem = z.infer<typeof transactionItemSchema>;

export const businessTransactionSchema = z.object({
  id: z.string(),
  partyId: z.string(),
  contactId: z.string(),
  type: transactionTypeSchema,
  referenceNo: z.string().nullable().optional(),
  date: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  paymentStatus: paymentStatusSchema,
  notes: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  items: z.array(transactionItemSchema),
  contact: z.object({ id: z.string(), name: z.string(), type: z.string() }).optional(),
  createdAt: z.string(),
});
export type BusinessTransaction = z.infer<typeof businessTransactionSchema>;

export interface CreateTransactionItemInput {
  productId: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
}

export interface CreateTransactionInput {
  contactId: string;
  type: TransactionType;
  items: CreateTransactionItemInput[];
  paidAmount?: number;
  referenceNo?: string;
  date?: string;
  notes?: string;
  dealId?: string;
}
