import { z } from "zod";

// ============================================
// ENUM
// ============================================
export const inquiryStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CONVERTED",
  "EXPIRED",
]);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

// ============================================
// INQUIRY
// ============================================
export const productInquirySchema = z.object({
  id: z.string(),
  productId: z.string(),
  buyerProfileId: z.string(),
  sellerPartyId: z.string(),
  status: inquiryStatusSchema,
  message: z.string().nullable().optional(),
  proposedQuantity: z.number().nullable().optional(),
  proposedPrice: z.number().nullable().optional(),
  bookingStart: z.string().nullable().optional(),
  bookingEnd: z.string().nullable().optional(),
  providerNote: z.string().nullable().optional(),
  finalPrice: z.number().nullable().optional(),
  orderId: z.string().nullable().optional(),
  respondedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: z
    .object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      currency: z.string().optional(),
      media: z
        .array(
          z.object({
            id: z.string(),
            url: z.string(),
            isPrimary: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  buyerProfile: z
    .object({
      id: z.string(),
      fullName: z.string().optional(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  sellerParty: z
    .object({
      id: z.string(),
      name: z.string().optional(),
    })
    .optional(),
});
export type ProductInquiry = z.infer<typeof productInquirySchema>;

// ============================================
// INPUT
// ============================================
export const createInquiryInputSchema = z
  .object({
    message: z.string().max(1000).optional(),
    proposedQuantity: z.number().int().min(1).optional(),
    proposedPrice: z.number().min(0).optional(),
    bookingStart: z.string().optional(),
    bookingEnd: z.string().optional(),
  })
  .refine(
    (d) => !d.bookingStart || !d.bookingEnd || new Date(d.bookingEnd) > new Date(d.bookingStart),
    { message: "bookingEnd harus setelah bookingStart", path: ["bookingEnd"] }
  );
export type CreateInquiryInput = z.infer<typeof createInquiryInputSchema>;

export const respondInquiryInputSchema = z
  .object({
    action: z.enum(["CONFIRM", "DECLINE"]),
    finalPrice: z.number().min(0).optional(),
    providerNote: z.string().max(1000).optional(),
  })
  .refine((d) => d.action !== "DECLINE" || !!d.providerNote, {
    message: "providerNote wajib diisi ketika action DECLINE",
    path: ["providerNote"],
  });
export type RespondInquiryInput = z.infer<typeof respondInquiryInputSchema>;