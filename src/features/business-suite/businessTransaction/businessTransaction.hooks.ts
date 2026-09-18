import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessTransactionApi } from "./businessTransaction.api";
import { CreateTransactionInput, TransactionType } from "./businessTransaction.schema";

export function useBusinessTransactions(
  partyId: string,
  params?: { page?: number; limit?: number; type?: TransactionType; contactId?: string }
) {
  return useQuery({
    queryKey: ["business-transactions", partyId, params],
    queryFn: () => businessTransactionApi.list(partyId, params),
    enabled: Boolean(partyId),
  });
}

export function useCreateBusinessTransaction(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => businessTransactionApi.create(partyId, input),
    onSuccess: () => {
      // Transaksi ini nyentuh banyak modul sekaligus (Persediaan, Piutang/
      // Hutang, Kas) — invalidate semuanya biar angka di mana-mana ikut update.
      queryClient.invalidateQueries({ queryKey: ["business-transactions", partyId] });
      queryClient.invalidateQueries({ queryKey: ["cashbook", partyId] });
      queryClient.invalidateQueries({ queryKey: ["receivable-card", partyId] });
      queryClient.invalidateQueries({ queryKey: ["debt-card", partyId] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["business-suite", "dashboard", partyId] });
    },
  });
}
