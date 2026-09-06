import { useEffect, useState, useRef, useCallback } from "react";
import { connectSocket, getSocket } from "@/lib/socket-client";
import { ChatMessage } from "./chat.schema";

export interface TypingUser {
  userId?: string;
  userName?: string;
  conversationId: string;
}

export interface ChatReactionEvent {
  conversationId: string;
  messageId: string;
  emoji: string;
  userId: string;
  action?: "add" | "remove" | "toggle";
}

/**
 * Hook koneksi chat real-time dengan dukungan typing indicators dan reaksi pesan.
 */
export function useChatSocket(
  conversationId: string | null,
  options?: { onReaction?: (data: ChatReactionEvent) => void }
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  // ✅ Fix: Gunakan ReturnType<typeof setTimeout> bukan NodeJS.Timeout
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Simpan referensi handler agar socket.off bisa target spesifik
  const handlersRef = useRef<{
    onMessageNew?: (message: ChatMessage) => void;
    onTypingStart?: (data?: { conversationId?: string; userId?: string; userName?: string; name?: string }) => void;
    onTypingStop?: (data?: { conversationId?: string }) => void;
    onReaction?: (data: ChatReactionEvent) => void;
  }>({});

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let active = true;

    connectSocket().then((socket) => {
      if (!active) return;

      // ✅ Fix: Definisikan handler sebagai named function dan simpan ref
      const onMessageNew = (message: ChatMessage) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => [...prev, message]);
          setIsTyping(false);
          setTypingUser(null);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      };

      const onTypingStart = (data?: { conversationId?: string; userId?: string; userName?: string; name?: string }) => {
        if (!data || data.conversationId === conversationId) {
          setIsTyping(true);
          setTypingUser({
            conversationId,
            userId: data?.userId,
            userName: data?.userName || data?.name || "Partner",
          });

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUser(null);
          }, 3500);
        }
      };

      const onTypingStop = (data?: { conversationId?: string }) => {
        if (!data || data.conversationId === conversationId) {
          setIsTyping(false);
          setTypingUser(null);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      };

      const onReaction = (data: ChatReactionEvent) => {
        if (data && (!data.conversationId || data.conversationId === conversationId)) {
          optionsRef.current?.onReaction?.(data);
        }
      };

      // Simpan ref untuk cleanup
      handlersRef.current = { onMessageNew, onTypingStart, onTypingStop, onReaction };

      socket.on("message:new", onMessageNew);
      socket.on("typing:start", onTypingStart);
      socket.on("typing:stop", onTypingStop);
      socket.on("chat:typing", onTypingStart);
      socket.on("chat:stop_typing", onTypingStop);
      socket.on("user:typing", onTypingStart);
      socket.on("user:stop_typing", onTypingStop);
      socket.on("message:reaction", onReaction);
      socket.on("reaction:add", onReaction);
      socket.on("reaction:remove", onReaction);
      socket.on("chat:reaction", onReaction);
    });

    return () => {
      active = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // ✅ Fix: Kirim typing stop saat unmount agar tidak tertinggal di server
      const socket = getSocket();
      if (socket && conversationId) {
        socket.emit("typing:stop", { conversationId });
        socket.emit("chat:stop_typing", { conversationId });
      }

      // ✅ Fix: Hapus listener spesifik berdasarkan ref, bukan semua listener event
      const socketInstance = getSocket();
      if (socketInstance) {
        const { onMessageNew, onTypingStart, onTypingStop, onReaction } = handlersRef.current;
        if (onMessageNew) socketInstance.off("message:new", onMessageNew);
        if (onTypingStart) {
          socketInstance.off("typing:start", onTypingStart);
          socketInstance.off("chat:typing", onTypingStart);
          socketInstance.off("user:typing", onTypingStart);
        }
        if (onTypingStop) {
          socketInstance.off("typing:stop", onTypingStop);
          socketInstance.off("chat:stop_typing", onTypingStop);
          socketInstance.off("user:stop_typing", onTypingStop);
        }
        if (onReaction) {
          socketInstance.off("message:reaction", onReaction);
          socketInstance.off("reaction:add", onReaction);
          socketInstance.off("reaction:remove", onReaction);
          socketInstance.off("chat:reaction", onReaction);
        }
      }
      handlersRef.current = {};
    };
  }, [conversationId]);

  const sendMessage = async (
    content: string,
    options?: {
      imageUrl?: string;
      attachments?: { type: "image" | "file"; url: string; name?: string; size?: number }[];
    }
  ) => {
    if (!conversationId) return;
    const socket = await connectSocket();
    const payload = {
      conversationId,
      content,
      imageUrl: options?.imageUrl,
      attachments: options?.attachments,
    };
    socket.emit("message:send", payload, () => {});
    socket.emit("typing:stop", { conversationId });
    socket.emit("chat:stop_typing", { conversationId });
  };

  const sendReaction = useCallback(
    async (messageId: string, emoji: string, userId?: string) => {
      if (!conversationId) return;
      const socket = await connectSocket();
      const payload: ChatReactionEvent = {
        conversationId,
        messageId,
        emoji,
        userId: userId || "me",
        action: "toggle",
      };
      socket.emit("message:reaction", payload);
      socket.emit("chat:reaction", payload);
    },
    [conversationId]
  );

  const sendTyping = useCallback(
    async (isTypingState: boolean) => {
      if (!conversationId) return;
      const socket = await connectSocket();
      if (isTypingState) {
        socket.emit("typing:start", { conversationId });
        socket.emit("chat:typing", { conversationId });
      } else {
        socket.emit("typing:stop", { conversationId });
        socket.emit("chat:stop_typing", { conversationId });
      }
    },
    [conversationId]
  );

  return { messages, sendMessage, isTyping, typingUser, sendTyping, sendReaction };
}