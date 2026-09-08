import { apiClient, PaginationMeta } from "@/lib/api-client";
import {
  CreateOpportunityInput,
  MarketplaceListParams,
  Opportunity,
} from "./opportunity.schema";

function toParams(params?: MarketplaceListParams): Record<string, string | number | boolean | undefined> {
  if (!params) return {};
  return {
    type: params.type,
    categoryId: params.categoryId,
    status: params.status,
    location: params.location,
    tag: params.tag,
    budgetMin: params.budgetMin,
    budgetMax: params.budgetMax,
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page,
    limit: params.limit,
  };
}

export const opportunityApi = {
  /** List publik marketplace (ACTIVE + PUBLIC di engine). Tidak wajib auth. */
  list: async (params?: MarketplaceListParams): Promise<{ data: Opportunity[]; meta?: PaginationMeta }> => {
    return apiClient.getWithMeta<Opportunity[]>("/api/v1/opportunities", {
      params: toParams(params),
      auth: false, // ✅ Diubah: list publik tidak memerlukan auth
    });
  },

  get: (id: string) => apiClient.get<Opportunity>(`/api/v1/opportunities/${id}`),

  create: (input: CreateOpportunityInput) =>
    apiClient.post<Opportunity>("/api/v1/opportunities", input),

  update: (id: string, input: Partial<CreateOpportunityInput> & { status?: string }) =>
    apiClient.patch<Opportunity>(`/api/v1/opportunities/${id}`, input),

  close: (id: string) =>
    apiClient.post<Opportunity>(`/api/v1/opportunities/${id}/close`),

  // NOTE: DELETE /opportunities/{id} sengaja tidak diimplementasikan.
  // Endpoint ini TIDAK ada di dokumentasi resmi (cahayaastera.com/api/docs).
  // Backend hanya menyediakan "close" (POST/PATCH /opportunities/{id}/close)
  // untuk menutup Opportunity — bukan hard-delete. Kalau butuh fitur hapus,
  // konfirmasi dulu ke tim backend apakah endpoint-nya akan ditambahkan.
};