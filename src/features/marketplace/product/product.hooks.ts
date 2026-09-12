"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "./product.api";
import { ListProductParams } from "./product.schema";

// ============================================
// QUERY KEYS
// ============================================
export const productKeys = {
  all: ["marketplace", "products"] as const,
  list: (params?: Partial<ListProductParams>) =>
    [...productKeys.all, "list", params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  mine: (params?: Partial<ListProductParams>) =>
    [...productKeys.all, "mine", params] as const,
};

// ============================================
// PUBLIC QUERIES
// ============================================

/** List produk publik (katalog) */
export function useProducts(params?: Partial<ListProductParams>, enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.list(params),
    staleTime: 60_000, // 1 menit
    enabled,
  });
}

/** Detail produk */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => (id ? productApi.getById(id) : Promise.reject("No ID")),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

// ============================================
// AUTH QUERIES
// ============================================

/** Produk milik sendiri */
export function useMyProducts(params?: Partial<ListProductParams>, enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.mine(params),
    queryFn: () => productApi.listMine(params),
    staleTime: 30_000,
    enabled,
  });
}

// ============================================
// MUTATIONS
// ============================================

/** Buat produk baru */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => productApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Update produk */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      productApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Hapus produk */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Upload media produk */
export function useUploadProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      productApi.uploadMedia(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/** Hapus media produk */
export function useDeleteProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mediaId }: { id: string; mediaId: string }) =>
      productApi.deleteMedia(id, mediaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/** Set primary media */
export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mediaId }: { id: string; mediaId: string }) =>
      productApi.setPrimaryMedia(id, mediaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}