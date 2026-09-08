import { apiClient } from "@/lib/api-client";
import { Escrow, EscrowListParams, InitiateHoldInput } from "./escrow.schema";

export const escrowApi = {
  /** POST /escrow/hold — mulai hold dana escrow (Buyer party owner yang manggil). */
  hold: (input: InitiateHoldInput) => apiClient.post<Escrow>("/api/v1/escrow/hold", input),

  /** GET /escrow — di-scope otomatis di backend ke Party milik profile yang login (buyer ATAU seller). */
  list: (params?: EscrowListParams) =>
    apiClient.getWithMeta<Escrow[]>("/api/v1/escrow", {
      params: {
        partyId: params?.partyId,
        status: params?.status,
        page: params?.page,
        limit: params?.limit,
      },
    }),

  /** GET /escrow/{id} — harus jadi participant (buyer/seller), atau ADMIN. */
  get: (id: string) => apiClient.get<Escrow>(`/api/v1/escrow/${id}`),

  /** POST /escrow/{id}/seller-confirm — hanya Seller Party terkait. */
  sellerConfirm: (id: string, notes?: string) =>
    apiClient.post<Escrow>(`/api/v1/escrow/${id}/seller-confirm`, { notes }),

  /** POST /escrow/{id}/buyer-confirm — hanya Buyer Party terkait. autoRelease=true langsung release. */
  buyerConfirm: (id: string, options?: { notes?: string; autoRelease?: boolean }) =>
    apiClient.post<Escrow>(`/api/v1/escrow/${id}/buyer-confirm`, options),

  /** POST /escrow/{id}/release — HANYA Buyer Party terkait yang boleh (bukan seller). */
  release: (id: string, notes?: string) =>
    apiClient.post<Escrow>(`/api/v1/escrow/${id}/release`, { notes }),

  /** POST /escrow/{id}/refund — Buyer ATAU Seller Party terkait boleh mengajukan. */
  refund: (id: string, reason?: string) =>
    apiClient.post<Escrow>(`/api/v1/escrow/${id}/refund`, { reason }),

  /** POST /escrow/{id}/dispute — Buyer ATAU Seller Party terkait. disputeReason wajib (min. 5 karakter). */
  dispute: (id: string, disputeReason: string) =>
    apiClient.post<Escrow>(`/api/v1/escrow/${id}/dispute`, { disputeReason }),
};
