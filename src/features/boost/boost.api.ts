import { apiClient } from "@/lib/api-client";
import { ActivateBoostInput, BoostPlan } from "./boost.schema";

// plans + checkout (README engine bagian 6 & OpenAPI /boosts/plans & /boosts/{id}/checkout)
export const boostApi = {
  plans: () => apiClient.get<BoostPlan[]>("/api/v1/boosts/plans"),
  // BUG FIX: backend SELALU mengembalikan field `paymentUrl` (bukan
  // `checkoutUrl`) untuk paket berbayar — lihat boost.service.js. Sebelumnya
  // tipe & pemanggil di halaman opportunity cuma cek `checkoutUrl`, yang
  // tidak pernah ada, jadi user boost berbayar TIDAK PERNAH diarahkan ke
  // halaman pembayaran Midtrans (modal langsung nutup & bilang "berhasil"
  // padahal boost-nya belum dibayar / masih pending).
  activate: (input: ActivateBoostInput) =>
    apiClient.post<{ paymentUrl?: string | null; free?: boolean; orderId?: string }>(
      `/api/v1/boosts/${input.opportunityId}/checkout`,
      { planId: input.planId }
    ),
};
