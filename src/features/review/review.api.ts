import { apiClient } from "@/lib/api-client";
import { CreateReviewInput, Review } from "./review.schema";

export const reviewApi = {
  /**
   * POST /reviews/deals/{dealId}
   * Body: { rating, comment }
   */
  create: (input: CreateReviewInput) =>
    apiClient.post<Review>(`/api/v1/reviews/deals/${input.dealId}`, {
      rating: input.rating,
      comment: input.comment,
    }),

  /**
   * GET /reviews/profile/{profileId}
   */
  listForProfile: (profileId: string) =>
    apiClient.get<Review[]>(`/api/v1/reviews/profile/${profileId}`),

  /** Alias kompatibilitas (lama: listForParty) */
  listForParty: (partyId: string) =>
    apiClient.get<Review[]>(`/api/v1/reviews/profile/${partyId}`),
};
