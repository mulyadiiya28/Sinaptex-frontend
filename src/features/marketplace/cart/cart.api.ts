import { apiClient } from "@/lib/api-client";
import { AddCartItemInput, Cart, CartItem, UpdateCartItemInput } from "./cart.schema";

/**
 * Cart API — keranjang belanja (butuh login).
 * Endpoint: /marketplace/cart
 */
export const cartApi = {
  /** GET /marketplace/cart — lihat keranjang */
  get: () => apiClient.get<Cart>("/api/v1/marketplace/cart"),

  /** POST /marketplace/cart/items — tambah item */
  addItem: (input: AddCartItemInput) =>
    apiClient.post<CartItem>("/api/v1/marketplace/cart/items", input),

  /** PATCH /marketplace/cart/items/:itemId — update quantity */
  updateItem: (itemId: string, input: UpdateCartItemInput) =>
    apiClient.patch<CartItem>(`/api/v1/marketplace/cart/items/${itemId}`, input),

  /** DELETE /marketplace/cart/items/:itemId — hapus item */
  removeItem: (itemId: string) =>
    apiClient.delete<null>(`/api/v1/marketplace/cart/items/${itemId}`),

  /** DELETE /marketplace/cart — kosongkan keranjang */
  clear: () => apiClient.delete<null>("/api/v1/marketplace/cart"),
};