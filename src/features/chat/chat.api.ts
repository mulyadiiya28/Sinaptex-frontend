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

  // NOTE: /api/v1/chat/reactions TIDAK ada di dokumentasi resmi OpenAPI
  // (cahayaastera.com/api/docs) — dikonfirmasi lewat pengecekan endpoint list.
  // Sebelumnya kode ini tetap memanggil endpoint tsb dan mengandalkan .catch()
  // untuk diam-diam "berhasil", padahal itu selalu gagal di backend (request
  // sia-sia setiap kali user reaksi). Reaksi realtime tetap jalan lewat
  // Socket.IO (lihat handleToggleReaction di chat/page.tsx yang panggil
  // sendReaction terlebih dahulu). Fungsi ini dibuat no-op sampai backend
  // benar-benar menyediakan endpoint REST untuk reaction.
  toggleReaction: async (
    _conversationId: string,
    _messageId: string,
    _emoji: string
  ): Promise<{ success: boolean; data?: unknown }> => {
    return { success: true };
  },
};
