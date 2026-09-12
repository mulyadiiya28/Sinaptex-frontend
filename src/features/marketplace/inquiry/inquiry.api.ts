import { apiClient } from "@/lib/api-client";
import {
  CreateInquiryInput,
  ProductInquiry,
  RespondInquiryInput,
} from "./inquiry.schema";
import { Order } from "../order/order.schema";

/**
 * Inquiry API — jalur INQUIRY_FIRST (PROPERTY / SERVICE kompleks).
 * Endpoint: /marketplace/inquiries/*
 */
export const inquiryApi = {
  /** POST /marketplace/products/:productId/inquiries */
  create: (productId: string, input: CreateInquiryInput) =>
    apiClient.post<ProductInquiry>(
      `/api/v1/marketplace/products/${productId}/inquiries`,
      input
    ),

  /** GET /marketplace/inquiries/me */
  listMine: () =>
    apiClient.get<ProductInquiry[]>("/api/v1/marketplace/inquiries/me"),

  /** GET /marketplace/inquiries/received */
  listReceived: () =>
    apiClient.get<ProductInquiry[]>("/api/v1/marketplace/inquiries/received"),

  /** GET /marketplace/inquiries/:id */
  getById: (id: string) =>
    apiClient.get<ProductInquiry>(`/api/v1/marketplace/inquiries/${id}`),

  /** PATCH /marketplace/inquiries/:id/respond */
  respond: (id: string, input: RespondInquiryInput) =>
    apiClient.patch<ProductInquiry>(
      `/api/v1/marketplace/inquiries/${id}/respond`,
      input
    ),

  /** POST /marketplace/inquiries/:id/checkout */
  checkout: (id: string, input: { shippingAddress?: Record<string, unknown>; notes?: string }) =>
    apiClient.post<Order>(`/api/v1/marketplace/inquiries/${id}/checkout`, input),
};