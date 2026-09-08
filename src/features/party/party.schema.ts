import { z } from "zod";

/**
 * Sesuai dokumentasi resmi (cahayaastera.com/api/docs — section "Party"):
 *
 *   POST   /parties
 *   GET    /parties
 *   GET    /parties/{id}
 *   PATCH  /parties/{id}
 *   POST   /parties/{id}/capabilities
 *   DELETE /parties/{id}/capabilities/{capabilityId}
 *
 * Bentuk field diambil dari RegisterProfileInput.party (auth.schema.ts) —
 * field yang sama dipakai saat Party pertama dibuat lewat POST /auth/register,
 * jadi kemungkinan besar konsisten dengan payload create Party mandiri di sini.
 *
 * CATATAN: response shape (terutama field tambahan seperti logoUrl,
 * verificationStatus, capabilities[]) belum dikonfirmasi dari source backend
 * modul Party — kalau ternyata beda, sesuaikan schema ini (mirip waktu kita
 * fix membership.api.ts kemarin).
 */

export const capabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Capability = z.infer<typeof capabilitySchema>;

export const partySchema = z.object({
  id: z.string(),
  name: z.string(),
  isCompany: z.boolean().optional().default(false),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  npwp: z.string().nullable().optional(),
  nib: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  verificationStatus: z.string().nullable().optional(), // "PENDING" | "APPROVED" | "REJECTED"
  capabilities: z.array(capabilitySchema).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Party = z.infer<typeof partySchema>;

export const createPartySchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(150),
  isCompany: z.boolean().optional(),
  categoryId: z.string().optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  npwp: z.string().optional(),
  nib: z.string().optional(),
});
export type CreatePartyInput = z.infer<typeof createPartySchema>;

export const updatePartySchema = createPartySchema.partial();
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
