import { apiClient, PaginationMeta } from "@/lib/api-client";
import { CashEntry, CashSummary, CreateCashEntryInput } from "./cashbook.schema";

interface ListEntriesParams {
  page?: number;
  limit?: number;
  type?: "INCOME" | "EXPENSE";
  category?: string;
}

type CashbookMeta = PaginationMeta & { summary: { income: number; expense: number; balance: number } };

interface ListEntriesResult {
  items: CashEntry[];
  meta: CashbookMeta;
}

export const cashbookApi = {
  /** GET /parties/{partyId}/cashbook */
  list: async (partyId: string, params?: ListEntriesParams): Promise<ListEntriesResult> => {
    const result = await apiClient.getWithMeta<CashEntry[]>(`/api/v1/parties/${partyId}/cashbook`, {
      params: params as Record<string, string | number | undefined>,
    });
    return {
      items: result.data ?? [],
      meta:
        (result.meta as CashbookMeta) ?? {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          summary: { income: 0, expense: 0, balance: 0 },
        },
    };
  },

  /** GET /parties/{partyId}/cashbook/summary */
  summary: (partyId: string) =>
    apiClient.get<CashSummary>(`/api/v1/parties/${partyId}/cashbook/summary`),

  /** POST /parties/{partyId}/cashbook */
  addEntry: (partyId: string, input: CreateCashEntryInput) =>
    apiClient.post<CashEntry>(`/api/v1/parties/${partyId}/cashbook`, input),

  /** DELETE /parties/{partyId}/cashbook/{entryId} */
  deleteEntry: (partyId: string, entryId: string) =>
    apiClient.delete<null>(`/api/v1/parties/${partyId}/cashbook/${entryId}`),
};
