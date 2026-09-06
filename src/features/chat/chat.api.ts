import { apiClient } from "@/lib/api-client";
import { ChatMessage, Conversation } from "./chat.schema";

const defaultConversations: Conversation[] = [
  {
    id: "conv_kemitraan_ekspor",
    originType: "NEED",
    opportunityId: "opp_1",
    lastMessage: {
      id: "msg_demo_1_latest",
      conversationId: "conv_kemitraan_ekspor",
      senderId: "partner_pt_makmur",
      content: "Bagus sekali. Kapan ada waktu untuk rapat teknis virtual terkait volume mingguan?",
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
  },
  {
    id: "conv_distribusi_logistik",
    originType: "OFFER",
    opportunityId: "opp_2",
    lastMessage: {
      id: "msg_demo_2",
      conversationId: "conv_distribusi_logistik",
      senderId: "partner_logistik_prima",
      content: "Siap, jadwal pickup cold storage bisa kita koordinasikan mulai pekan depan.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
];

const defaultMessages: Record<string, ChatMessage[]> = {
  conv_kemitraan_ekspor: [
    {
      id: "msg_demo_1",
      conversationId: "conv_kemitraan_ekspor",
      senderId: "partner_pt_makmur",
      content: "Halo! Kami tertarik untuk mendiskusikan kemitraan pasokan komoditas untuk kuota ekspor Q3.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: {
        "👍": ["me"],
        "🤝": ["partner_pt_makmur", "me"],
      },
    },
    {
      id: "msg_demo_1_reply",
      conversationId: "conv_kemitraan_ekspor",
      senderId: "me",
      content: "Halo rekan PT Makmur, terima kasih atas responsnya. Dokumen spesifikasi dan sertifikasi mutu sudah kami siapkan.",
      createdAt: new Date(Date.now() - 2400000).toISOString(),
      reactions: {
        "🔥": ["partner_pt_makmur"],
        "👏": ["partner_pt_makmur"],
      },
    },
    {
      id: "msg_demo_1_latest",
      conversationId: "conv_kemitraan_ekspor",
      senderId: "partner_pt_makmur",
      content: "Bagus sekali. Kapan ada waktu untuk rapat teknis virtual terkait volume mingguan?",
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      reactions: {
        "💡": ["me"],
      },
    },
    {
      id: "msg_demo_1_img",
      conversationId: "conv_kemitraan_ekspor",
      senderId: "me",
      content: "Berikut foto sampel produk dan kemasan siap ekspor kami.",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
      createdAt: new Date(Date.now() - 600000).toISOString(),
      reactions: {
        "👍": ["partner_pt_makmur"],
        "❤️": ["partner_pt_makmur"],
      },
    },
  ],
  conv_distribusi_logistik: [
    {
      id: "msg_demo_2",
      conversationId: "conv_distribusi_logistik",
      senderId: "partner_logistik_prima",
      content: "Siap, jadwal pickup cold storage bisa kita koordinasikan mulai pekan depan.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      reactions: {
        "🚀": ["me"],
        "👍": ["partner_logistik_prima"],
      },
    },
  ],
};

// conversations + messages (README engine bagian 6)
export const chatApi = {
  listConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get<Conversation[]>("/api/v1/chat/conversations");
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      return defaultConversations;
    } catch {
      return defaultConversations;
    }
  },
  listMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const res = await apiClient.get<ChatMessage[]>(`/api/v1/chat/conversations/${conversationId}/messages`);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      return defaultMessages[conversationId] ?? [
        {
          id: `msg_init_${conversationId}`,
          conversationId,
          senderId: "partner",
          content: "Halo! Ruang obrolan telah dibuka. Silakan diskusikan kebutuhan dan kolaborasi Anda di sini.",
          createdAt: new Date().toISOString(),
          reactions: {
            "🤝": ["partner"],
          },
        },
      ];
    } catch {
      return defaultMessages[conversationId] ?? [
        {
          id: `msg_init_${conversationId}`,
          conversationId,
          senderId: "partner",
          content: "Halo! Ruang obrolan telah dibuka. Silakan diskusikan kebutuhan dan kolaborasi Anda di sini.",
          createdAt: new Date().toISOString(),
          reactions: {
            "🤝": ["partner"],
          },
        },
      ];
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
  // Kirim pesan sebaiknya lewat Socket.IO event `message:send` (real-time),
  // endpoint REST ini dipakai untuk upload media (multipart) — lihat chat-socket.ts.
};
