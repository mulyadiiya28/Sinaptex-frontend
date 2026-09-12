import { apiClient } from "@/lib/api-client";
import {
  CreateReviewInput,
  ProductReview,
  UpdateReviewInput,
} from "./review.schema";

/**
 * Review API — ulasan produk marketplace.
 * Endpoint: /marketplace/products/:productId/reviews
 */
export const reviewApi = {
  /** GET /marketplace/products/:productId/reviews — list review (publik) */
  listByProduct: (productId: string) =>
    apiClient.getWithMeta<ProductReview[]>(
      `/api/v1/marketplace/products/${productId}/reviews`,
      { auth: false }
    ),

  /** POST /marketplace/products/:productId/reviews — buat review (auth) */
  create: (productId: string, input: CreateReviewInput) =>
    apiClient.post<ProductReview>(
      `/api/v1/marketplace/products/${productId}/reviews`,
      input
    ),

  /** PATCH /marketplace/reviews/:reviewId — update review */
  update: (reviewId: string, input: UpdateReviewInput) =>
    apiClient.patch<ProductReview>(`/api/v1/marketplace/reviews/${reviewId}`, input),

  /** DELETE /marketplace/reviews/:reviewId — hapus review */
  remove: (reviewId: string) =>
    apiClient.delete<null>(`/api/v1/marketplace/reviews/${reviewId}`),
};