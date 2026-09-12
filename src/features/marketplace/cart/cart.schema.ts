import { z } from "zod";

// ============================================
// CART ITEM
// ============================================
export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  quantity: z.number(),
  unit: z.string().nullable().optional(),
  quantityInBaseUnit: z.number().nullable().optional(),
  bookingStart: z.string().nullable().optional(),
  bookingEnd: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relasi
  product: z
    .object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      currency: z.string().optional(),
      baseUnit: z.string(),
      media: z
        .array(
          z.object({
            id: z.string(),
            url: z.string(),
            isPrimary: z.boolean().optional(),
          })
        )
        .optional(),
      party: z
        .object({
          id: z.string(),
          name: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

// ============================================
// CART (full)
// ============================================
export const cartSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  items: z.array(cartItemSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Meta (kalau backend kirim total)
  totalAmount: z.number().optional(),
  totalItems: z.number().optional(),
});
export type Cart = z.infer<typeof cartSchema>;

// ============================================
// INPUT — Add / Update
// ============================================
export const addCartItemInputSchema = z
  .object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().positive().max(99999).default(1),
    unit: z.string().min(1).max(20).optional(),
    bookingStart: z.string().optional(),
    bookingEnd: z.string().optional(),
  })
  .refine(
    (d) => !d.bookingStart || !d.bookingEnd || new Date(d.bookingEnd) > new Date(d.bookingStart),
    { message: "bookingEnd harus setelah bookingStart", path: ["bookingEnd"] }
  );
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>;

export const updateCartItemInputSchema = z.object({
  quantity: z.number().min(0).max(99999),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;