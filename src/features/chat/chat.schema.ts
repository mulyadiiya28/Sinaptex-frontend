import { z } from "zod";

// originType NEED tanpa gate membership; OFFER/PROFILE saat ini masih gate
// membership di chat.policy.js versi production (lihat README engine bagian 4).
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
