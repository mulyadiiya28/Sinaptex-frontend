"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "./order.api";
import { CheckoutInput, UpdateOrderStatusInput } from "./order.schema";

export const orderKeys = {
  all: ["marketplace", "orders"] as const,
  myOrders: () => [...orderKeys.all, "my-orders"] as const,
  mySales: () => [...orderKeys.all, "my-sales"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

// ============================================
// QUERIES
// ============================================

/** Order sebagai pembeli */
export function useMyOrders(enabled: boolean = true) {
  return useQuery({
    queryKey: orderKeys.myOrders(),
    queryFn: orderApi.listMyOrders,
    staleTime: 30_000,
    enabled,
  });
}

/** Penjualan sebagai penjual */
export function useMySales(enabled: boolean = true) {
  return useQuery({
    queryKey: orderKeys.mySales(),
    queryFn: orderApi.listMySales,
    staleTime: 30_000,
    enabled,
  });
}

/** Detail order */
export function useOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => (id ? orderApi.getById(id) : Promise.reject("No ID")),
    enabled: Boolean(id),
  });
}

// ============================================
// MUTATIONS
// ============================================

/** Checkout dari cart */
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => orderApi.checkout(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "cart"] });
    },
  });
}

/** Update status sub-order (seller) */
export function useUpdateSubOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subOrderId, input }: { subOrderId: string; input: UpdateOrderStatusInput }) =>
      orderApi.updateSubOrderStatus(subOrderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** Konfirmasi terima (buyer) */
export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subOrderId: string) => orderApi.confirmDelivery(subOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}