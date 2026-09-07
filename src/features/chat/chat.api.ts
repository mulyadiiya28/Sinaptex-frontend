import { apiClient } from "@/lib/api-client";
import { ChatMessage, Conversation } from "./chat.schema";

/**
 * CATATAN MOCK / FALLBACK:
 * - listConversations & listMessages: jika API kosong/gagal, fallback ke data demo
 *   agar UI chat tidak blank saat development.
 * - Di production sebaiknya hapus fallback demo dan tampilkan empty state saja.
 * - Endpoint /api/v1/chat/reactions belum ada di OpenAPI resmi.
 * - Kirim pesan real-time via Socket.IO event `message:send` (lihat chat-socket.ts).
 */

const defaultConversations: Conversation[] = [];

const defaultMessages: Record<string, ChatMessage[]> = {};

export const chatApi = {
  listConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get<Conversation[]>("/api/v1/chat/conversations");
      if (Array.isArray(res)) return res;
      return defaultConversations;
    } catch {
      // API belum tersedia / error — empty list (bukan demo palsu)
      return defaultConversations;
    }
  },

  listMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const res = await apiClient.get<ChatMessage[]>(
        `/api/v1/chat/conversations/${conversationId}/messages`
      );
      if (Array.isArray(res)) return res;
      return defaultMessages[conversationId] ?? [];
    } catch {
      return defaultMessages[conversationId] ?? [];
    }
  },

  toggleReaction: (conversationId: string, messageId: string, emoji: string) =>
    apiClient
      .post<{ success: boolean; data?: unknown }>("/api/v1/chat/reactions", {
        conversationId,
        messageId,
        emoji,
      })
      .catch(() => ({ success: true })),
};
