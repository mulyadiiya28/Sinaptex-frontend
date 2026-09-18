import { createLedgerCardHooks } from "../ledger.hooks";

export const { useLedgerEntries: useDebtEntries, useAddLedgerEntry: useAddDebtEntry } =
  createLedgerCardHooks("debt-card", "debt-card");
