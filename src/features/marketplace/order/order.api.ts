import { apiClient } from "@/lib/api-client";
import {
  CheckoutInput,
  Order,
  OrderSub,
  UpdateOrderStatusInput,
} from "./order.schema";

/**
 * Order API — checkout & manajemen pesanan (butuh login).
 * Endpoint: /marketplace/orders
 */
export const orderApi = {
  // ============================================
  // CHECKOUT
  // ============================================

  /** POST /marketplace/orders/checkout — checkout dari cart */
  checkout: (input: CheckoutInput) =>
    apiClient.post<{
      order: Order;
      paymentUrl: string;
      token: string;
    }>("/api/v1/marketplace/orders/checkout", input),

  // ============================================
  // LIST (BUYER / SELLER)
  // ============================================

  /** GET /marketplace/orders/my/orders — order sebagai pembeli */
  listMyOrders: () => apiClient.get<Order[]>("/api/v1/marketplace/orders/my/orders"),

  /** GET /marketplace/orders/my/sales — penjualan sebagai penjual */
  listMySales: () => apiClient.get<Order[]>("/api/v1/marketplace/orders/my/sales"),

  // ============================================
  // DETAIL
  // ============================================

  /** GET /marketplace/orders/:id — detail order */
  getById: (id: string) => apiClient.get<Order>(`/api/v1/marketplace/orders/${id}`),

  // ============================================
  // UPDATE STATUS (SELLER)
  // ============================================

  /** PATCH /marketplace/orders/sub-orders/:subOrderId/status — update status sub-order */
  updateSubOrderStatus: (subOrderId: string, input: UpdateOrderStatusInput) =>
    apiClient.patch<OrderSub>(
      `/api/v1/marketplace/orders/sub-orders/${subOrderId}/status`,
      input
    ),

  /** POST /marketplace/orders/sub-orders/:subOrderId/confirm — konfirmasi terima (buyer) */
  confirmDelivery: (subOrderId: string) =>
    apiClient.post<OrderSub>(
      `/api/v1/marketplace/orders/sub-orders/${subOrderId}/confirm`
    ),

  checkoutFromInquiry: (inquiryId: string, input: CheckoutInput) =>
    apiClient.post<{
      order: Order;
      paymentUrl: string;
      token: string;
    }>(`/api/v1/marketplace/orders/checkout-inquiry/${inquiryId}`, input),
};