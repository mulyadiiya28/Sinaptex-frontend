import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLedgerCardApi } from "./ledger.api";
import { CreateLedgerEntryInput } from "./ledger.schema";

export function createLedgerCardHooks(segment: "receivable-card" | "debt-card", queryKeyPrefix: string) {
  const api = createLedgerCardApi(segment);

  function useLedgerEntries(partyId: string, contactId: string, page = 1) {
    return useQuery({
      queryKey: [queryKeyPrefix, partyId, contactId, page],
      queryFn: () => api.listEntries(partyId, contactId, page),
      enabled: Boolean(partyId) && Boolean(contactId),
    });
  }

  function useAddLedgerEntry(partyId: string, contactId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (input: CreateLedgerEntryInput) => api.addEntry(partyId, contactId, input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, partyId, contactId] });
      },
    });
  }

  return { useLedgerEntries, useAddLedgerEntry };
}
