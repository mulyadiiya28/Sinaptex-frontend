"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "./chat.api";

export const chatKeys = {
  conversations: ["chat", "conversations"] as const,
  messages: (conversationId: string) => ["chat", "messages", conversationId] as const,
  blocks: ["chat", "blocks"] as const,
};

// ============================================
// CONVERSATIONS
// ============================================
export function useConversations(enabled: boolean = true) {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: chatApi.listConversations,
    refetchInterval: 10_000,
    enabled,
  });
}

// ============================================
// MESSAGES
// ============================================
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: () => (conversationId ? chatApi.listMessages(conversationId) : Promise.resolve([])),
    enabled: Boolean(conversationId),
  });
}

// ============================================
// FR-16: BLOCK / UNBLOCK PROFILE
// ============================================
export function useListBlocked(enabled: boolean = true) {
  return useQuery({
    queryKey: chatKeys.blocks,
    queryFn: chatApi.listBlocked,
    enabled,
  });
}

export function useBlockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockedProfileId, reason }: { blockedProfileId: string; reason?: string }) =>
      chatApi.blockProfile(blockedProfileId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.blocks });
    },
  });
}

export function useUnblockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedProfileId: string) => chatApi.unblockProfile(blockedProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.blocks });
    },
  });
}