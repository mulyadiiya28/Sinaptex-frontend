import { apiClient } from "@/lib/api-client";
import { CreatePartyInput, Party, UpdatePartyInput } from "./party.schema";

export const partyApi = {
  /** GET /parties — list semua Party milik Profile yang login */
  list: () => apiClient.get<Party[]>("/api/v1/parties"),

  /** GET /parties/{id} — publik (endpoint pakai optionalAuth: kirim token
   *  kalau ada supaya backend bisa hitung `isOwner` & tampilkan info rekening
   *  bank lengkap ke pemiliknya sendiri; anonim tetap bisa akses). */
  get: (id: string) => apiClient.get<Party>(`/api/v1/parties/${id}`),

  /** POST /parties — buat Party baru untuk Profile yang login (mis. akun perusahaan kedua) */
  create: (input: CreatePartyInput) => apiClient.post<Party>("/api/v1/parties", input),

  /** PATCH /parties/{id} — update Party milik sendiri */
  update: (id: string, input: UpdatePartyInput) =>
    apiClient.patch<Party>(`/api/v1/parties/${id}`, input),

  /** POST /parties/{id}/capabilities — tambah Capability ke Party milik sendiri */
  addCapability: (id: string, name: string) =>
    apiClient.post<Party>(`/api/v1/parties/${id}/capabilities`, { name }),

  /** DELETE /parties/{id}/capabilities/{capabilityId} — hapus Capability dari Party milik sendiri */
  removeCapability: (id: string, capabilityId: string) =>
    apiClient.delete<void>(`/api/v1/parties/${id}/capabilities/${capabilityId}`),

  /**
   * DELETE /parties/{id} — soft delete Party (owner only).
   * Produk ikut nonaktif, chat & history tetap.
   */
  delete: (id: string) =>
    apiClient.delete<void>(`/api/v1/parties/${id}`),
};
