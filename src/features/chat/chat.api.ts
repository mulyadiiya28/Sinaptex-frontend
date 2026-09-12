import { apiClient } from "@/lib/api-client";
import {
  BlockedProfile,
  ChatMessage,
  Conversation,
  ReportReason,
  StartConversationInput,
} from "./chat.schema";

/**
 * CATATAN:
 * - Kirim pesan REALTIME via Socket.IO (lihat chat-socket.ts → useChatSocket).
 * - REST di sini untuk: upload gambar/attachment, fallback, history, block.
 * - toggleReaction: no-op (endpoint /chat/reactions belum ada di backend).
 */

const defaultConversations: Conversation[] = [];
const defaultMessages: Record<string, ChatMessage[]> = {};

export const chatApi = {
  // ============================================
  // CONVERSATIONS
  // ============================================
  listConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get<Conversation[]>("/api/v1/chat/conversations");
      if (Array.isArray(res)) return res;
      return defaultConversations;
    } catch {
      return defaultConversations;
    }
  },

  startConversation: (input: StartConversationInput) =>
    apiClient.post<Conversation>("/api/v1/chat/conversations", input),

  // ============================================
  // MESSAGES
  // ============================================
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

  /**
   * Kirim pesan via REST — untuk upload gambar/attachment atau fallback
   * kalau Socket.IO tidak connect. Untuk teks realtime, pakai
   * useChatSocket().sendMessage (Socket.IO).
   */
  sendMessage: (
    conversationId: string,
    data: { type: "TEXT" | "IMAGE" | "ATTACHMENT"; content?: string; file?: File }
  ) => {
    const formData = new FormData();
    formData.append("type", data.type);
    if (data.content) formData.append("content", data.content);
    if (data.file) formData.append("file", data.file);

    return apiClient.post<ChatMessage>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      formData
    );
  },

  markAsRead: (conversationId: string) =>
    apiClient.patch<null>(`/api/v1/chat/conversations/${conversationId}/read`),

  // ============================================
  // REPORT PEER (FR-16 anti-spam)
  // ============================================
  reportPeer: (conversationId: string, reason: ReportReason, description?: string) =>
    apiClient.post(`/api/v1/chat/conversations/${conversationId}/report`, {
      reason,
      description,
    }),

  // ============================================
  // FR-16: BLOCK / UNBLOCK PROFILE
  // ============================================
  blockProfile: (blockedProfileId: string, reason?: string) =>
    apiClient.post<BlockedProfile>("/api/v1/chat/blocks", {
      blockedProfileId,
      reason,
    }),

  listBlocked: () => apiClient.get<BlockedProfile[]>("/api/v1/chat/blocks"),

  unblockProfile: (blockedProfileId: string) =>
    apiClient.delete<null>(`/api/v1/chat/blocks/${blockedProfileId}`),

  // ============================================
  // REACTIONS (no-op — endpoint belum ada di backend)
  // ============================================
  toggleReaction: async (
    _conversationId: string,
    _messageId: string,
    _emoji: string
  ): Promise<{ success: boolean; data?: unknown }> => {
    return { success: true };
  },
};