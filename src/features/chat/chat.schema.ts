import { z } from "zod";

// FR-16: Direct chat bebas dikirim siapa saja ke siapa saja, TIDAK ADA
// gating membership. Satu-satunya syarat: penerima tidak sedang memblokir
// pengirim (lihat chatApi.blockProfile / listBlocked / unblockProfile).
export const chatOriginTypeSchema = z.enum(["NEED", "OFFER", "PROFILE"]);
export type ChatOriginType = z.infer<typeof chatOriginTypeSchema>;

export const messageReactionSchema = z.object({
  emoji: z.string(),
  count: z.number().default(0),
  users: z.array(z.string()).default([]),
});
export type MessageReaction = z.infer<typeof messageReactionSchema>;

export type ReactionRecord = Record<string, string[]>;

export const messageAttachmentSchema = z.object({
  type: z.enum(["image", "file"]).default("image"),
  url: z.string(),
  name: z.string().optional(),
  size: z.number().optional(),
});
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  reactions: z.record(z.string(), z.array(z.string())).optional(),
  imageUrl: z.string().optional(),
  attachments: z.array(messageAttachmentSchema).optional(),
});
export type ChatMessage = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  originType: chatOriginTypeSchema,
  opportunityId: z.string().nullable().optional(),
  lastMessage: messageSchema.nullable().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, "Pesan tidak boleh kosong").max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ============================================
// FR-16: Block / Unblock Profile
// ============================================
export const blockedProfileInfoSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable().optional(),
});
export type BlockedProfileInfo = z.infer<typeof blockedProfileInfoSchema>;

export const blockedProfileSchema = z.object({
  id: z.string(),
  blockerProfileId: z.string(),
  blockedProfileId: z.string(),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
  blocked: blockedProfileInfoSchema.optional(),
});
export type BlockedProfile = z.infer<typeof blockedProfileSchema>;

export const blockProfileInputSchema = z.object({
  blockedProfileId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
export type BlockProfileInput = z.infer<typeof blockProfileInputSchema>;

// ============================================
// Start Conversation Input
// ============================================
export const startConversationInputSchema = z.object({
  recipientProfileId: z.string().uuid(),
  originType: chatOriginTypeSchema.default("PROFILE"),
  opportunityId: z.string().uuid().optional(),
});
export type StartConversationInput = z.infer<typeof startConversationInputSchema>;

// ============================================
// Report Peer Input
// ============================================
export const reportReasonSchema = z.enum([
  "SPAM",
  "PENIPUAN",
  "KONTEN_TIDAK_PANTAS",
  "PELECEHAN",
  "LAINNYA",
]);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const reportPeerInputSchema = z.object({
  reason: reportReasonSchema,
  description: z.string().max(1000).optional(),
});
export type ReportPeerInput = z.infer<typeof reportPeerInputSchema>;