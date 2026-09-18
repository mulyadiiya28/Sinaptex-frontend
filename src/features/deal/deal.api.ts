import { apiClient } from "@/lib/api-client";
import { Deal, DealStatus } from "./deal.schema";

export interface CreateDealInput {
  conversationId: string;
  dealType?: string;
  agreedAmount?: number;
  currency?: string;
  terms?: Record<string, unknown>;
  deadline?: string;
  notes?: string;
}

// Endpoint terpadu — lihat Checklist Fase 2.3. Mengembalikan/menerima deal
// dari KEDUA sumber sekaligus (Invitation matching maupun Conversation chat).
export const dealApi = {
  /** GET /deals/me */
  list: () => apiClient.get<Deal[]>("/api/v1/deals/me"),

  /** POST /deals — buat Deal dari sebuah percakapan chat */
  create: (input: CreateDealInput) => apiClient.post<Deal>("/api/v1/deals", input),

  /** PATCH /deals/{id} */
  updateStatus: (id: string, status: DealStatus, extra?: { cancelReason?: string }) =>
    apiClient.patch<Deal>(`/api/v1/deals/${id}`, { status, ...extra }),
};
