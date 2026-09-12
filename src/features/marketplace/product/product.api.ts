import { apiClient } from "@/lib/api-client";
import { ListProductParams, Product } from "./product.schema";

/**
 * Product API — katalog marketplace (GOODS / SERVICE / PROPERTY).
 * Endpoint publik (list, detail) tidak butuh auth.
 * Endpoint "my products" & CRUD butuh auth.
 */
export const productApi = {
  // ============================================
  // PUBLIC — List & Detail
  // ============================================

  /** GET /marketplace/products — list produk (publik) */
  list: (params?: Partial<ListProductParams>) =>
    apiClient.getWithMeta<Product[]>("/api/v1/marketplace/products", {
      auth: false,
      params: params as Record<string, string | number | boolean | undefined>,
    }),

  /** GET /marketplace/products/:id — detail produk (publik) */
  getById: (id: string) =>
    apiClient.get<Product>(`/api/v1/marketplace/products/${id}`, { auth: false }),

  // ============================================
  // AUTH — My Products
  // ============================================

  /** GET /marketplace/products/my/products — produk milik sendiri */
  listMine: (params?: Partial<ListProductParams>) =>
    apiClient.getWithMeta<Product[]>("/api/v1/marketplace/products/my/products", {
      params: params as Record<string, string | number | boolean | undefined>,
    }),

  // ============================================
  // AUTH — CRUD
  // ============================================

  /** POST /marketplace/products — buat produk baru */
  create: (input: Record<string, unknown>) =>
    apiClient.post<Product>("/api/v1/marketplace/products", input),

  /** PATCH /marketplace/products/:id — update produk */
  update: (id: string, input: Record<string, unknown>) =>
    apiClient.patch<Product>(`/api/v1/marketplace/products/${id}`, input),

  /** DELETE /marketplace/products/:id — hapus produk */
  remove: (id: string) =>
    apiClient.delete<null>(`/api/v1/marketplace/products/${id}`),

  // ============================================
  // AUTH — Media
  // ============================================

  /** POST /marketplace/products/:id/media — upload media (multipart) */
  uploadMedia: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(`/api/v1/marketplace/products/${id}/media`, formData);
  },

  /** DELETE /marketplace/products/:id/media/:mediaId — hapus media */
  deleteMedia: (id: string, mediaId: string) =>
    apiClient.delete<null>(`/api/v1/marketplace/products/${id}/media/${mediaId}`),

  /** PATCH /marketplace/products/:id/media/:mediaId/primary — set primary media */
  setPrimaryMedia: (id: string, mediaId: string) =>
    apiClient.patch<null>(`/api/v1/marketplace/products/${id}/media/${mediaId}/primary`),
};