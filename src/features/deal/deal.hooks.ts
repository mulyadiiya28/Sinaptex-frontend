import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dealApi, CreateDealInput } from "./deal.api";
import { DealStatus } from "./deal.schema";

const dealKeys = { all: ["deals"] as const };

export function useDeals() {
  return useQuery({ queryKey: dealKeys.all, queryFn: dealApi.list });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDealInput) => dealApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      cancelReason,
    }: {
      id: string;
      status: DealStatus;
      cancelReason?: string;
    }) => dealApi.updateStatus(id, status, cancelReason ? { cancelReason } : undefined),
    onSuccess: (_data, variables) => {
      // Invalidate deals list
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
      // ✅ Fix: Juga invalidate opportunity detail karena status deal berubah
      queryClient.invalidateQueries({ queryKey: ["opportunities", "detail"] });
      // ✅ Fix: Invalidate chat conversations karena deal baru bisa buka chat room
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      // ✅ Fix: Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // ✅ Fix: Invalidate deal detail jika ada
      queryClient.invalidateQueries({ queryKey: ["deals", "detail", variables.id] });
    },
  });
}