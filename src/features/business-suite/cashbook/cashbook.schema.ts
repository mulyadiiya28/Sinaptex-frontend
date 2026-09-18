import { z } from "zod";

// Default dari businessSuite.config.js (backend) — tidak ada endpoint GET
// untuk daftar kategori, jadi di-hardcode sesuai default config. Kalau admin
// mengubah env BS_CASHBOOK_CATEGORIES di server, daftar ini perlu disamakan
// manual.
export const cashCategoryOptions = [
  "PENJUALAN",
  "PEMBELIAN",
  "OPERASIONAL",
  "Gaji",
  "Transport",
  "Utilitas",
  "Marketing",
  "Lainnya",
  "Pencairan Pinjaman",
  "Angsuran Pinjaman",
  "Payroll",
] as const;

export const cashEntryTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export type CashEntryType = z.infer<typeof cashEntryTypeSchema>;

export const cashAccountTypeSchema = z.enum(["BANK", "ON_HAND"]);
export type CashAccountType = z.infer<typeof cashAccountTypeSchema>;

export const cashEntrySchema = z.object({
  id: z.string(),
  cashBookId: z.string(),
  partyId: z.string(),
  type: cashEntryTypeSchema,
  amount: z.number(),
  currency: z.string(),
  category: z.string(),
  accountType: cashAccountTypeSchema,
  description: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "VOID"]),
  createdAt: z.string(),
});
export type CashEntry = z.infer<typeof cashEntrySchema>;

export const cashSummarySchema = z.object({
  partyId: z.string(),
  currency: z.string(),
  balance: z.number(),
  totalIncome: z.number(),
  totalExpense: z.number(),
});
export type CashSummary = z.infer<typeof cashSummarySchema>;

export const createCashEntrySchema = z.object({
  type: cashEntryTypeSchema,
  amount: z.number().positive("Nominal harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  accountType: cashAccountTypeSchema.default("ON_HAND"),
  description: z.string().max(500).optional(),
});
export type CreateCashEntryInput = z.infer<typeof createCashEntrySchema>;
