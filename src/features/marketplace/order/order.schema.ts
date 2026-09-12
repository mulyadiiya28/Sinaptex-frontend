import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const orderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const subOrderStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export type SubOrderStatus = z.infer<typeof subOrderStatusSchema>;

// ============================================
// ORDER ITEM
// ============================================
export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  quantity: z.number(),
  unit: z.string().nullable().optional(),
  price: z.number(),
  totalPrice: z.number().optional(),
  productName: z.string().optional(),
  product: z
    .object({
      id: z.string(),
      name: z.string(),
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
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// ============================================
// ORDER SUB (kalau multi-seller)
// ============================================
export const orderSubSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  sellerPartyId: z.string(),
  status: subOrderStatusSchema,
  totalAmount: z.number(),
  trackingNumber: z.string().nullable().optional(),
  sellerParty: z
    .object({
      id: z.string(),
      name: z.string().optional(),
    })
    .optional(),
  items: z.array(orderItemSchema).optional(),
});
export type OrderSub = z.infer<typeof orderSubSchema>;

// ============================================
// ORDER (full)
// ============================================
export const orderSchema = z.object({
  id: z.string(),
  buyerId: z.string(),
  status: orderStatusSchema,
  totalAmount: z.number(),
  currency: z.string().default("IDR"),
  shippingAddress: z.record(z.string(), z.unknown()).nullable().optional(),
  notes: z.string().nullable().optional(),
  invoiceNumber: z.string(),
  escrowId: z.string().nullable().optional(),
  bookingConfirmedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relasi
  buyer: z
    .object({
      id: z.string(),
      fullName: z.string().optional(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  items: z.array(orderItemSchema).optional(),
  subOrders: z.array(orderSubSchema).optional(),
});
export type Order = z.infer<typeof orderSchema>;

// ============================================
// INPUT — Checkout / Update Status
// ============================================
export const checkoutInputSchema = z.object({
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().max(100).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;