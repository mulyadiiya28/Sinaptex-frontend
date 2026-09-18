import { apiClient, PaginationMeta } from "@/lib/api-client";
import { BusinessTransaction, CreateTransactionInput, TransactionType } from "./businessTransaction.schema";

export const businessTransactionApi = {
  /** POST /parties/{partyId}/transactions */
  create: (partyId: string, input: CreateTransactionInput) =>
    apiClient.post<BusinessTransaction>(`/api/v1/parties/${partyId}/transactions`, input),

  /** GET /parties/{partyId}/transactions */
  list: async (
    partyId: string,
    params?: { page?: number; limit?: number; type?: TransactionType; contactId?: string }
  ) => {
    const result = await apiClient.getWithMeta<BusinessTransaction[]>(
      `/api/v1/parties/${partyId}/transactions`,
      { params: params as Record<string, string | number | undefined> }
    );
    return { items: result.data ?? [], meta: result.meta as PaginationMeta | undefined };
  },

  /** GET /parties/{partyId}/transactions/{transactionId} */
  get: (partyId: string, transactionId: string) =>
    apiClient.get<BusinessTransaction>(`/api/v1/parties/${partyId}/transactions/${transactionId}`),
};
