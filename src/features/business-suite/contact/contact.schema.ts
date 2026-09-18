import { z } from "zod";

export const contactTypeSchema = z.enum(["CUSTOMER", "SUPPLIER", "DEBTOR", "CREDITOR", "MEMBER"]);
export type ContactType = z.infer<typeof contactTypeSchema>;

export const contactTypeLabels: Record<ContactType, string> = {
  CUSTOMER: "Pelanggan",
  SUPPLIER: "Supplier",
  DEBTOR: "Debitur (berhutang ke saya)",
  CREDITOR: "Kreditur (saya berhutang)",
  MEMBER: "Anggota Koperasi",
};

export const contactSchema = z.object({
  id: z.string(),
  partyId: z.string(),
  type: contactTypeSchema,
  code: z.string().nullable().optional(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]),
  creditLimit: z.number().nullable().optional(),
  paymentTerms: z.number().nullable().optional(),
  createdAt: z.string(),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = z.object({
  type: contactTypeSchema,
  name: z.string().min(2, "Nama minimal 2 karakter").max(150),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  taxId: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
  creditLimit: z.number().nonnegative().optional(),
  paymentTerms: z.number().int().nonnegative().optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;
