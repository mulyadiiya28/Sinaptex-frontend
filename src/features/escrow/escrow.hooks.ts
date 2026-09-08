import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { escrowApi } from "./escrow.api";
import { EscrowListParams, InitiateHoldInput } from "./escrow.schema";

export const escrowKeys = {
  all: ["escrow"] as const,
  list: (params?: EscrowListParams) => ["escrow", "list", params] as const,
  detail: (id: string) => ["escrow", "detail", id] as const,
};

export function useEscrowList(params?: EscrowListParams) {
  return useQuery({
    queryKey: escrowKeys.list(params),
    queryFn: () => escrowApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useEscrow(id: string) {
  return useQuery({
    queryKey: escrowKeys.detail(id),
    queryFn: () => escrowApi.get(id),
    enabled: Boolean(id),
  });
}

function useEscrowAction<TArgs extends { id: string }>(
  mutationFn: (args: TArgs) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.all });
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(args.id) });
    },
  });
}

export function useInitiateEscrowHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InitiateHoldInput) => escrowApi.hold(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.all });
    },
  });
}

/** Konfirmasi Seller — HANYA boleh dipanggil oleh Seller Party terkait, backend akan 403 selain itu. */
export function useEscrowSellerConfirm() {
  return useEscrowAction<{ id: string; notes?: string }>(({ id, notes }) =>
    escrowApi.sellerConfirm(id, notes)
  );
}

/** Konfirmasi Buyer — HANYA boleh dipanggil oleh Buyer Party terkait. */
export function useEscrowBuyerConfirm() {
  return useEscrowAction<{ id: string; notes?: string; autoRelease?: boolean }>(
    ({ id, notes, autoRelease }) => escrowApi.buyerConfirm(id, { notes, autoRelease })
  );
}

/** Release dana ke Seller — HANYA boleh dipanggil oleh Buyer Party terkait (bukan Seller!). */
export function useEscrowRelease() {
  return useEscrowAction<{ id: string; notes?: string }>(({ id, notes }) =>
    escrowApi.release(id, notes)
  );
}

/** Refund ke Buyer — boleh diajukan Buyer ATAU Seller Party terkait. */
export function useEscrowRefund() {
  return useEscrowAction<{ id: string; reason?: string }>(({ id, reason }) =>
    escrowApi.refund(id, reason)
  );
}

/** Ajukan dispute — boleh diajukan Buyer ATAU Seller Party terkait. disputeReason wajib. */
export function useEscrowDispute() {
  return useEscrowAction<{ id: string; disputeReason: string }>(({ id, disputeReason }) =>
    escrowApi.dispute(id, disputeReason)
  );
}
