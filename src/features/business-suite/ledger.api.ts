import { apiClient, PaginationMeta } from "@/lib/api-client";
import { LedgerCard, LedgerEntry, CreateLedgerEntryInput } from "./ledger.schema";

/**
 * ReceivableCard (piutang) & DebtCard (hutang) punya endpoint yang bentuknya
 * identik persis di backend, cuma beda segment URL
 * (`receivable-card` vs `debt-card`). Daripada duplikasi kode, satu factory
 * generik ini dipakai untuk keduanya — lihat receivableCard/api.ts &
 * debtCard/api.ts yang tinggal memanggil ini dengan segment berbeda.
 */
export function createLedgerCardApi(segment: "receivable-card" | "debt-card") {
  return {
    /** GET /parties/{partyId}/contacts/{contactId}/{segment} */
    getSummary: (partyId: string, contactId: string) =>
      apiClient.get<LedgerCard>(`/api/v1/parties/${partyId}/contacts/${contactId}/${segment}`),

    /** GET /parties/{partyId}/contacts/{contactId}/{segment}/entries */
    listEntries: async (partyId: string, contactId: string, page = 1, limit = 20) => {
      const result = await apiClient.getWithMeta<{ card: LedgerCard; entries: LedgerEntry[] }>(
        `/api/v1/parties/${partyId}/contacts/${contactId}/${segment}/entries`,
        { params: { page, limit } }
      );
      return {
        card: result.data?.card ?? null,
        entries: result.data?.entries ?? [],
        meta: result.meta as PaginationMeta | undefined,
      };
    },

    /** POST /parties/{partyId}/contacts/{contactId}/{segment}/entries */
    addEntry: (partyId: string, contactId: string, input: CreateLedgerEntryInput) =>
      apiClient.post<LedgerEntry>(
        `/api/v1/parties/${partyId}/contacts/${contactId}/${segment}/entries`,
        input
      ),
  };
}
