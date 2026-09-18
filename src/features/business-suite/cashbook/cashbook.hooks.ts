import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cashbookApi } from "./cashbook.api";
import { CreateCashEntryInput } from "./cashbook.schema";

const keys = {
  list: (partyId: string, params?: unknown) => ["cashbook", partyId, "list", params] as const,
  summary: (partyId: string) => ["cashbook", partyId, "summary"] as const,
};

export function useCashEntries(
  partyId: string,
  params?: { page?: number; limit?: number; type?: "INCOME" | "EXPENSE"; category?: string }
) {
  return useQuery({
    queryKey: keys.list(partyId, params),
    queryFn: () => cashbookApi.list(partyId, params),
    enabled: Boolean(partyId),
  });
}

export function useCashSummary(partyId: string) {
  return useQuery({
    queryKey: keys.summary(partyId),
    queryFn: () => cashbookApi.summary(partyId),
    enabled: Boolean(partyId),
  });
}

export function useAddCashEntry(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashEntryInput) => cashbookApi.addEntry(partyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashbook", partyId] });
    },
  });
}

export function useDeleteCashEntry(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => cashbookApi.deleteEntry(partyId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashbook", partyId] });
    },
  });
}
