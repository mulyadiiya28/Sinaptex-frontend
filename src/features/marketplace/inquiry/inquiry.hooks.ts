"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inquiryApi } from "./inquiry.api";
import {
  CreateInquiryInput,
  RespondInquiryInput,
} from "./inquiry.schema";

export const inquiryKeys = {
  all: ["marketplace", "inquiries"] as const,
  mine: () => [...inquiryKeys.all, "mine"] as const,
  received: () => [...inquiryKeys.all, "received"] as const,
  detail: (id: string) => [...inquiryKeys.all, "detail", id] as const,
};

// ============================================
// QUERIES
// ============================================

export function useMyInquiries(enabled: boolean = true) {
  return useQuery({
    queryKey: inquiryKeys.mine(),
    queryFn: inquiryApi.listMine,
    staleTime: 30_000,
    enabled,
  });
}

export function useReceivedInquiries(enabled: boolean = true) {
  return useQuery({
    queryKey: inquiryKeys.received(),
    queryFn: inquiryApi.listReceived,
    staleTime: 30_000,
    enabled,
  });
}

export function useInquiry(id: string | null) {
  return useQuery({
    queryKey: inquiryKeys.detail(id ?? ""),
    queryFn: () => (id ? inquiryApi.getById(id) : Promise.reject("No ID")),
    enabled: Boolean(id),
  });
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateInquiry(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInquiryInput) => inquiryApi.create(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
    },
  });
}

export function useRespondInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RespondInquiryInput }) =>
      inquiryApi.respond(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
    },
  });
}

export function useCheckoutFromInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { shippingAddress?: Record<string, unknown>; notes?: string } }) =>
      inquiryApi.checkout(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "orders"] });
    },
  });
}