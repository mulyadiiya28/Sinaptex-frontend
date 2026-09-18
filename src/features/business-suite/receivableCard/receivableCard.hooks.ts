import { createLedgerCardHooks } from "../ledger.hooks";

export const { useLedgerEntries: useReceivableEntries, useAddLedgerEntry: useAddReceivableEntry } =
  createLedgerCardHooks("receivable-card", "receivable-card");
