"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "./cart.api";
import { AddCartItemInput, UpdateCartItemInput } from "./cart.schema";

export const cartKeys = {
  all: ["marketplace", "cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
};

// ============================================
// QUERIES
// ============================================

/** Lihat keranjang */
export function useCart(enabled: boolean = true) {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: cartApi.get,
    staleTime: 30_000,
    enabled,
  });
}

// ============================================
// MUTATIONS
// ============================================

/** Tambah item ke keranjang */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => cartApi.addItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Update quantity item */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateCartItemInput }) =>
      cartApi.updateItem(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Hapus item dari keranjang */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** Kosongkan keranjang */
export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}