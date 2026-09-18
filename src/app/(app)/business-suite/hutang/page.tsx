"use client";

import { LedgerCardPageContent } from "@/components/business-suite/ledger-card-page";
import { useDebtEntries, useAddDebtEntry } from "@/features/business-suite/debtCard/debtCard.hooks";

export default function HutangPage() {
  return (
    <LedgerCardPageContent
      title="Hutang"
      description="Tagihan yang harus dibayar ke supplier/kreditur."
      contactType="CREDITOR"
      debitLabel="Hutang Baru (+)"
      creditLabel="Pembayaran Keluar (-)"
      balanceLabel="Sisa Hutang"
      hooks={{ useLedgerEntries: useDebtEntries, useAddLedgerEntry: useAddDebtEntry }}
    />
  );
}
