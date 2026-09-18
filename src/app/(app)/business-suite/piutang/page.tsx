"use client";

import { LedgerCardPageContent } from "@/components/business-suite/ledger-card-page";
import { useReceivableEntries, useAddReceivableEntry } from "@/features/business-suite/receivableCard/receivableCard.hooks";

export default function PiutangPage() {
  return (
    <LedgerCardPageContent
      title="Piutang"
      description="Tagihan yang harus diterima dari pelanggan/debitur."
      contactType="DEBTOR"
      debitLabel="Piutang Baru (+)"
      creditLabel="Pembayaran Masuk (-)"
      balanceLabel="Sisa Piutang"
      hooks={{ useLedgerEntries: useReceivableEntries, useAddLedgerEntry: useAddReceivableEntry }}
    />
  );
}
