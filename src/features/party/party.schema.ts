import { z } from "zod";

/**
 * Sesuai dokumentasi resmi (cahayaastera.com/api/docs — section "Party")
 * DAN dikonfirmasi langsung dari source backend (party.controller.js,
 * party.routes.js):
 *
 *   POST   /parties                                  (requireAuth)
 *   GET    /parties                                  (requireAuth — punya sendiri)
 *   GET    /parties/{id}                              (publik)
 *   PATCH  /parties/{id}                              (requireAuth — pemilik saja)
 *   POST   /parties/{id}/capabilities                 (requireAuth — pemilik saja)
 *   DELETE /parties/{id}/capabilities/{capabilityId}  (requireAuth — pemilik saja)
 *
 * Semua response Party di-include dengan (lihat `includeDefault` di controller):
 *   category, capabilities (join PartyCapability -> capability), businessRoles,
 *   verifications ({ id, type, status } saja — bukan dokumen lengkapnya, itu
 *   ada di modul verification-documents terpisah).
 */

export const capabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Capability = z.infer<typeof capabilitySchema>;

/** Baris join PartyCapability — capability aktualnya nested di field `capability`. */
export const partyCapabilityLinkSchema = z.object({
  capability: capabilitySchema,
});
export type PartyCapabilityLink = z.infer<typeof partyCapabilityLinkSchema>;

export const partyCategorySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});
export type PartyCategory = z.infer<typeof partyCategorySchema>;

export const businessRoleSchema = z.object({
  role: z.string(),
});
export type BusinessRole = z.infer<typeof businessRoleSchema>;

export const partyVerificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(), // "PENDING" | "APPROVED" | "REJECTED"
});
export type PartyVerification = z.infer<typeof partyVerificationSchema>;

export const partySchema = z.object({
  id: z.string(),
  ownerId: z.string().optional(),
  name: z.string(),
  isCompany: z.boolean().optional().default(false),
  categoryId: z.string().nullable().optional(),
  category: partyCategorySchema.nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  npwp: z.string().nullable().optional(),
  nib: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  capabilities: z.array(partyCapabilityLinkSchema).optional().default([]),
  businessRoles: z.array(businessRoleSchema).optional().default([]),
  verifications: z.array(partyVerificationSchema).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Party = z.infer<typeof partySchema>;

/** Helper: ambil nama capability sebagai string[] biasa untuk ditampilkan di UI. */
export function getCapabilityNames(party: Pick<Party, "capabilities">): string[] {
  return (party.capabilities ?? []).map((c) => c.capability.name);
}

export const createPartySchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(150),
  isCompany: z.boolean().optional(),
  categoryId: z.string().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  npwp: z.string().optional(),
  nib: z.string().optional(),
  /** Opsional: langsung tambahkan capability saat create (dihandle transaksional di backend). */
  capabilityNames: z.array(z.string()).optional(),
  /** Opsional: langsung tambahkan business role saat create. */
  businessRoles: z.array(z.string()).optional(),
});
export type CreatePartyInput = z.infer<typeof createPartySchema>;

/** PATCH /parties/{id} menerima req.body apa adanya — capabilityNames/businessRoles TIDAK
 * diproses di sini (cuma di create), jadi update tidak mengikutkan field itu. */
export const updatePartySchema = createPartySchema
  .omit({ capabilityNames: true, businessRoles: true })
  .partial();
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;