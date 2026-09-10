"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "./chat.api";
import { SendMessageInput } from "./chat.schema";

export const chatKeys = {
  conversations: ["chat", "conversations"] as const,
  messages: (conversationId: string) => ["chat", "messages", conversationId] as const,
};

export function useConversations(enabled: boolean = true) {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: chatApi.listConversations,
    refetchInterval: 10_000,
    enabled,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: () => (conversationId ? chatApi.listMessages(conversationId) : Promise.resolve([])),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: SendMessageInput) => {
      // Endpoint REST fallback bila ada atau direct return
      return { id: `msg_${Date.now()}`, conversationId, content, senderId: "me", createdAt: new Date().toISOString() };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        chatKeys.messages(data.conversationId),
        (old: unknown) => (Array.isArray(old) ? [...old, data] : [data])
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}
