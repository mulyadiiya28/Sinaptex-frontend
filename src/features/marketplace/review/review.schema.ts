import { z } from "zod";

// ============================================
// REVIEW
// ============================================
export const productReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  reviewerId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  isVerified: z.boolean(),
  hidden: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relasi
  reviewer: z
    .object({
      id: z.string(),
      fullName: z.string().optional(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
});
export type ProductReview = z.infer<typeof productReviewSchema>;

// ============================================
// INPUT
// ============================================
export const createReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export const updateReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;