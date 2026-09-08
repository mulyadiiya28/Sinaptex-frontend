import { z } from "zod";

/**
 * Sesuai dokumentasi resmi (cahayaastera.com/api/docs — section "Escrow")
 * DAN dikonfirmasi dari source backend (escrow.controller.js, escrow.routes.js,
 * escrow.service.js).
 *
 *   POST /escrow/hold                    — buat escrow baru, langsung status HELD
 *   GET  /escrow                         — list milik Party sendiri (buyer ATAU seller)
 *   GET  /escrow/{id}                    — detail (harus jadi participant)
 *   POST /escrow/{id}/seller-confirm     — hanya Seller Party
 *   POST /escrow/{id}/buyer-confirm      — hanya Buyer Party (bisa autoRelease)
 *   POST /escrow/{id}/release            — hanya Buyer Party
 *   POST /escrow/{id}/refund             — Buyer ATAU Seller
 *   POST /escrow/{id}/dispute            — Buyer ATAU Seller
 *
 * CATATAN status: dari escrow.service.js status yang benar-benar di-set adalah
 * HELD, SELLER_CONFIRMED, BUYER_CONFIRMED, RELEASED, REFUNDED, DISPUTED.
 * "PENDING_HOLD" dan "CANCELLED" disebut di JSDoc routes tapi tidak pernah
 * dipakai di service — dimasukkan di enum untuk jaga-jaga tapi kemungkinan
 * besar tidak akan pernah muncul dari backend saat ini.
 */

export const escrowStatusSchema = z.enum([
  "PENDING_HOLD", // reserved, belum pernah di-set backend saat ini
  "HELD",
  "SELLER_CONFIRMED",
  "BUYER_CONFIRMED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
  "CANCELLED", // reserved, belum pernah di-set backend saat ini
]);
export type EscrowStatus = z.infer<typeof escrowStatusSchema>;

/** Bentuk minimal Party yang muncul di GET /escrow (list) */
export const escrowPartySlimSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  verificationStatus: z.string().nullable().optional(),
});
export type EscrowPartySlim = z.infer<typeof escrowPartySlimSchema>;

/** Bentuk lebih kaya di GET /escrow/{id} (detail) — punya info owner & verification. */
export const escrowPartyDetailSchema = escrowPartySlimSchema.extend({
  owner: z
    .object({
      id: z.string(),
      fullName: z.string().nullable().optional(),
      companyName: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  verification: z.unknown().optional(),
});
export type EscrowPartyDetail = z.infer<typeof escrowPartyDetailSchema>;

export const escrowDealSlimSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  invitation: z
    .object({
      opportunity: z
        .object({ id: z.string(), title: z.string(), type: z.string() })
        .optional(),
    })
    .optional(),
});
export type EscrowDealSlim = z.infer<typeof escrowDealSlimSchema>;

/**
 * Schema permisif yang menampung bentuk list MAUPUN detail sekaligus
 * (party bisa slim atau detail — union, field opsional tetap aman dipakai UI).
 */
export const escrowSchema = z.object({
  id: z.string(),
  dealId: z.string().nullable().optional(),
  buyerPartyId: z.string().optional(),
  sellerPartyId: z.string().optional(),
  buyerParty: z.union([escrowPartyDetailSchema, escrowPartySlimSchema]).optional(),
  sellerParty: z.union([escrowPartyDetailSchema, escrowPartySlimSchema]).optional(),
  deal: escrowDealSlimSchema.nullable().optional(),
  amount: z.number(),
  fee: z.number().optional().default(0),
  currency: z.string().optional().default("IDR"),
  status: escrowStatusSchema,
  holdReference: z.string().nullable().optional(),
  releaseReference: z.string().nullable().optional(),
  refundReference: z.string().nullable().optional(),
  heldAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.unknown().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Escrow = z.infer<typeof escrowSchema>;

export const initiateHoldSchema = z.object({
  buyerPartyId: z.string().uuid(),
  sellerPartyId: z.string().uuid(),
  amount: z.number().positive("Jumlah escrow harus lebih dari 0"),
  fee: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  dealId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type InitiateHoldInput = z.infer<typeof initiateHoldSchema>;

export type EscrowListParams = {
  partyId?: string;
  status?: EscrowStatus;
  page?: number;
  limit?: number;
};
