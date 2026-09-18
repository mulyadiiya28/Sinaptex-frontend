import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { opportunityApi } from "./opportunity.api";
import {
  CreateOpportunityInput,
  MarketplaceListParams,
  OPPORTUNITY_QUOTA_EXCEEDED,
} from "./opportunity.schema";

export const opportunityKeys = {
  all: ["opportunities"] as const,
  list: (params?: MarketplaceListParams) => ["opportunities", "list", params] as const,
  detail: (id: string) => ["opportunities", "detail", id] as const,
};

/** Marketplace / list publik dengan filter + pagination. */
export function useMarketplace(params?: MarketplaceListParams) {
  return useQuery({
    queryKey: opportunityKeys.list(params),
    queryFn: () => opportunityApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** Alias lama — dipakai dashboard & "milik saya" (client-side filter bila perlu). */
export function useOpportunities(params?: MarketplaceListParams) {
  return useMarketplace(params);
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => opportunityApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOpportunityInput) => opportunityApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    },
    onError: (error: Error) => {
      // Jangan throw di sini — React Query onError tidak menangkap throw.
      // Error sudah tersedia di mutation state (isError, error).
      // Consumer hook/page bertanggung jawab menampilkan toast/modal.
      if (error.message.includes(OPPORTUNITY_QUOTA_EXCEEDED)) {
        // Override message agar lebih user-friendly
        error.message = "Kuota posting aktif sudah penuh. Tutup posting lama atau upgrade membership.";
      }
    },
  });
}

export function useCloseOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => opportunityApi.close(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
    },
  });
}

/** Fase 2.2 — "Kirim Minat" ke pemilik opportunity (auto-buat conversation chat). */
export function useExpressInterest() {
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      opportunityApi.expressInterest(id, message),
  });
}