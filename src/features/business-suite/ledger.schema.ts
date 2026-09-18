import { z } from "zod";

// ReceivableCard & DebtCard punya struktur identik di backend (cuma beda
// makna debit/credit: piutang debit=nambah tagihan, hutang debit=nambah
// hutang saya). Satu schema dipakai untuk keduanya.
export const ledgerCardSchema = z.object({
  id: z.string(),
  partyId: z.string(),
  contactId: z.string(),
  openingBalance: z.number(),
  totalDebit: z.number(),
  totalCredit: z.number(),
  currentBalance: z.number(),
  currency: z.string(),
  lastTransactionAt: z.string().nullable().optional(),
});
export type LedgerCard = z.infer<typeof ledgerCardSchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  cardId: z.string(),
  partyId: z.string(),
  date: z.string(),
  description: z.string(),
  referenceNo: z.string().nullable().optional(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
  createdAt: z.string(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const createLedgerEntrySchema = z.object({
  description: z.string().min(1, "Keterangan wajib diisi").max(300),
  referenceNo: z.string().max(80).optional(),
  debit: z.number().nonnegative().optional(),
  credit: z.number().nonnegative().optional(),
  date: z.string().optional(),
});
export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
