import { z } from "zod";

// Deal: NEGOTIATION -> DEAL | CANCELLED | EXPIRED
// DEAL -> IN_PROGRESS | CANCELLED | EXPIRED
// IN_PROGRESS -> COMPLETED | CANCELLED
export const dealStatusSchema = z.enum([
  "NEGOTIATION",
  "DEAL",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);
export type DealStatus = z.infer<typeof dealStatusSchema>;

const profileRefSchema = z.object({
  id: z.string(),
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

// Deal sekarang bisa berasal dari 2 sumber (lihat Checklist Fase 2.3):
//  - invitationId terisi -> dari Matching Engine (Invitation)
//  - conversationId terisi -> dari chat/inquiry marketplace
// Selalu salah satu yang terisi, tidak pernah dua-duanya / tidak keduanya.
export const dealSchema = z.object({
  id: z.string(),
  invitationId: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
  initiatorId: z.string().nullable().optional(),
  responderId: z.string().nullable().optional(),
  dealType: z.string().optional(),
  status: dealStatusSchema,
  agreedAmount: z.number().nullable().optional(),
  currency: z.string().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  initiator: profileRefSchema.nullable().optional(),
  responder: profileRefSchema.nullable().optional(),
  invitation: z
    .object({
      fromParty: z.object({ id: z.string(), ownerId: z.string(), name: z.string().optional() }).optional(),
      toParty: z.object({ id: z.string(), ownerId: z.string(), name: z.string().optional() }).optional(),
      opportunity: z.object({ id: z.string(), title: z.string().optional() }).optional(),
    })
    .nullable()
    .optional(),
});
export type Deal = z.infer<typeof dealSchema>;

/** Profile ID lawan bicara di deal ini, relatif terhadap `myProfileId`. */
export function getCounterpartyProfileId(deal: Deal, myProfileId: string): string | null {
  if (deal.invitation?.fromParty && deal.invitation?.toParty) {
    const { fromParty, toParty } = deal.invitation;
    if (fromParty.ownerId === myProfileId) return toParty.ownerId;
    if (toParty.ownerId === myProfileId) return fromParty.ownerId;
    return null;
  }
  if (deal.initiatorId === myProfileId) return deal.responderId ?? null;
  if (deal.responderId === myProfileId) return deal.initiatorId ?? null;
  return null;
}

/** Nama tampilan lawan bicara, kalau datanya sudah ikut ter-include. */
export function getCounterpartyName(deal: Deal, myProfileId: string): string | null {
  const counterpartyId = getCounterpartyProfileId(deal, myProfileId);
  if (!counterpartyId) return null;
  if (deal.initiator?.id === counterpartyId) return deal.initiator.fullName ?? null;
  if (deal.responder?.id === counterpartyId) return deal.responder.fullName ?? null;
  return null;
}
