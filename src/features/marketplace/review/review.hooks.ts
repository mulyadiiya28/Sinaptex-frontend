"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "./review.api";
import { CreateReviewInput, UpdateReviewInput } from "./review.schema";

export const reviewKeys = {
  all: ["marketplace", "reviews"] as const,
  byProduct: (productId: string) =>
    [...reviewKeys.all, "product", productId] as const,
};

// ============================================
// QUERIES
// ============================================

/** List review untuk satu produk */
export function useProductReviews(productId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId ?? ""),
    queryFn: () =>
      productId
        ? reviewApi.listByProduct(productId)
        : Promise.resolve({ data: [], meta: undefined }),
    enabled: Boolean(productId) && enabled,
    staleTime: 60_000,
  });
}

// ============================================
// MUTATIONS
// ============================================

/** Buat review */
export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewApi.create(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) });
    },
  });
}

/** Update review */
export function useUpdateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; input: UpdateReviewInput }) =>
      reviewApi.update(reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) });
    },
  });
}

/** Hapus review */
export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.remove(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(productId) });
    },
  });
}