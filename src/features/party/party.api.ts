import { apiClient } from "@/lib/api-client";
import { CreatePartyInput, Party, UpdatePartyInput } from "./party.schema";

export const partyApi = {
  /** GET /parties — list semua Party milik Profile yang login */
  list: () => apiClient.get<Party[]>("/api/v1/parties"),

  /** GET /parties/{id} — publik, dipakai frontend nampilkan profil di halaman Opportunity */
  get: (id: string) => apiClient.get<Party>(`/api/v1/parties/${id}`, { auth: false }),

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
};
