import { z } from "zod";

// Sesuai engine: opportunity.validation.js + listOpportunities controller

export const opportunityTypeSchema = z.enum(["NEED", "OFFER"]);
export type OpportunityType = z.infer<typeof opportunityTypeSchema>;

export const opportunityStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "MATCHED",
  "CLOSED",
  "EXPIRED",
  "CANCELLED",
]);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

export const opportunityPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;

export const partySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  verificationStatus: z.string().optional().nullable(),
  logoUrl: z.string().nullable().optional(),
});
export type PartySummary = z.infer<typeof partySummarySchema>;

export const createOpportunitySchema = z.object({
  type: opportunityTypeSchema,
  title: z.string().min(3, "Judul minimal 3 karakter").max(150),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(3000),
  categoryId: z.string().optional(),
  partyId: z.string().uuid().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  location: z.string().max(120).optional(),
  tags: z.array(z.string()).max(20).optional(),
  priority: opportunityPrioritySchema.optional(),
  capabilityNames: z.array(z.string()).optional(),
});
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const opportunitySchema = z.object({
  id: z.string(),
  type: opportunityTypeSchema,
  status: opportunityStatusSchema,
  title: z.string(),
  description: z.string(),
  categoryId: z.string().nullable().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  priority: opportunityPrioritySchema.optional().nullable(),
  createdAt: z.string(),
  party: partySummarySchema.optional().nullable(),
  partyId: z.string().optional().nullable(),
  // Dihitung server-side (Fase 2.2) — dipakai buat nentuin tampilkan
  // kontrol pengelolaan (Boost dst.) vs tombol "Kirim Minat".
  isOwner: z.boolean().optional(),
});
export type Opportunity = z.infer<typeof opportunitySchema>;

/** Query params marketplace / list publik */
export type MarketplaceListParams = {
  type?: OpportunityType;
  categoryId?: string;
  status?: OpportunityStatus;
  location?: string;
  tag?: string;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
  sortBy?: "createdAt" | "budgetMin" | "budgetMax" | "priority";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  /** Hanya posting milik user (bukan di engine list publik; dipakai UI "Milik saya") */
  mine?: boolean;
};

export const OPPORTUNITY_QUOTA_EXCEEDED = "OPPORTUNITY_QUOTA_EXCEEDED";
