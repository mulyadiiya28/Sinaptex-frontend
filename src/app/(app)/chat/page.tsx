"use client";

import { useState, useMemo, useRef, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  User,
  Briefcase,
  Search,
  Sparkles,
} from "lucide-react";
import { useConversations, useMessages } from "@/features/chat/chat.hooks";
import { useChatSocket } from "@/features/chat/chat-socket";
import { chatApi } from "@/features/chat/chat.api";
import { ChatMessage, Conversation, ReactionRecord } from "@/features/chat/chat.schema";
import { useSessionStore } from "@/store/use-session-store";
import { MessageReactions, MessageReactionTrigger } from "@/components/chat/message-reactions";
import {
  ChatAttachmentMenu,
  AttachmentPreview,
  SelectedAttachment,
} from "@/components/chat/chat-attachment-menu";
import { ImageLightbox, ChatImageThumb } from "@/components/chat/image-lightbox";

export default function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ opportunityId?: string; conversationId?: string }>;
}) {
  const resolvedParams = searchParams ? use(searchParams) : undefined;
  const targetOppId = resolvedParams?.opportunityId;
  const initialConvId = resolvedParams?.conversationId;

  const me = useSessionStore((s) => s.me);
  const { data: conversations, isLoading: isConvsLoading } = useConversations();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId ?? null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionRecord>>({});
  const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<SelectedAttachment | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Compute active conversation ID
  const activeConvId = useMemo(() => {
    if (selectedConvId) return selectedConvId;
    if (targetOppId && conversations) {
      const found = conversations.find((c) => c.opportunityId === targetOppId);
      if (found) return found.id;
    }
    return conversations?.[0]?.id ?? null;
  }, [selectedConvId, targetOppId, conversations]);

  const { data: historyMessages, isLoading: isMsgLoading } = useMessages(activeConvId);

  const handleSocketReaction = useCallback(
    (data: { messageId: string; emoji: string; userId: string; action?: "add" | "remove" | "toggle" }) => {
      const { messageId, emoji, userId, action } = data;
      setUserReactions((prev) => {
        const currentMsg = { ...(prev[messageId] || {}) };
        const users = [...(currentMsg[emoji] || [])];
        let nextUsers: string[];

        if (action === "add") {
          nextUsers = users.includes(userId) ? users : [...users, userId];
        } else if (action === "remove") {
          nextUsers = users.filter((u) => u !== userId);
        } else {
          nextUsers = users.includes(userId)
            ? users.filter((u) => u !== userId)
            : [...users, userId];
        }

        if (nextUsers.length === 0) {
          delete currentMsg[emoji];
        } else {
          currentMsg[emoji] = nextUsers;
        }

        return {
          ...prev,
          [messageId]: currentMsg,
        };
      });
    },
    []
  );

  const socketOptions = useMemo(() => ({ onReaction: handleSocketReaction }), [handleSocketReaction]);

  const {
    messages: socketMessages,
    sendMessage: sendViaSocket,
    isTyping,
    typingUser,
    sendTyping,
    sendReaction,
  } = useChatSocket(activeConvId, socketOptions);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Combine history, socket, and locally sent messages
  const allMessages = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    (historyMessages ?? []).forEach((m) => map.set(m.id, m));
    socketMessages.forEach((m) => map.set(m.id, m));
    sentMessages.filter((m) => m.conversationId === activeConvId).forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [historyMessages, socketMessages, sentMessages, activeConvId]);

  // Derive reactions map from message payloads overlayed with real-time user/socket toggles
  const reactionsMap = useMemo(() => {
    const map: Record<string, ReactionRecord> = {};

    // 1. Initial reactions from messages
    allMessages.forEach((m) => {
      if (m.reactions && Object.keys(m.reactions).length > 0) {
        map[m.id] = { ...m.reactions };
      }
    });

    // 2. Overlay user / socket reactions
    Object.entries(userReactions).forEach(([msgId, reactions]) => {
      map[msgId] = {
        ...(map[msgId] ?? {}),
        ...reactions,
      };
    });

    return map;
  }, [allMessages, userReactions]);

  // Auto scroll on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeConvId) return;
    const currentUserId = me?.id || "me";

    setUserReactions((prev) => {
      const currentMsgMap = reactionsMap[messageId] || {};
      const currentUsers = currentMsgMap[emoji] || [];
      const hasReacted = currentUsers.includes(currentUserId);
      const nextUsers = hasReacted
        ? currentUsers.filter((u) => u !== currentUserId)
        : [...currentUsers, currentUserId];

      const currentMsg = { ...(prev[messageId] || currentMsgMap) };
      if (nextUsers.length === 0) {
        delete currentMsg[emoji];
      } else {
        currentMsg[emoji] = nextUsers;
      }

      return {
        ...prev,
        [messageId]: currentMsg,
      };
    });

    try {
      await sendReaction(messageId, emoji, currentUserId);
    } catch {
      // socket fallback
    }

    try {
      await chatApi.toggleReaction(activeConvId, messageId, emoji);
    } catch {
      // rest fallback
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!activeConvId) return;

    if (val.trim()) {
      sendTyping(true);

      // Debounce stopping the typing status
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      sendTyping(false);
    }
  };


  const activeConv: Conversation | undefined = conversations?.find((c) => c.id === activeConvId);

  const filteredConversations = (conversations ?? []).filter((c) => {
    if (!searchQuery) return true;
    return (
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.opportunityId && c.opportunityId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const previewUrl = URL.createObjectURL(file);
          setPendingAttachment({
            file,
            previewUrl,
            name: file.name || `Pasted_image_${Date.now()}.png`,
            size: file.size,
          });
          break;
        }
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setPendingAttachment({
        file,
        previewUrl,
        name: file.name,
        size: file.size,
      });
    }
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !pendingAttachment) || !activeConvId) return;

    const currentAttachment = pendingAttachment;
    setPendingAttachment(null);
    setInputText("");

    const displayContent = text || "📷 Foto";
    const attachmentUrl = currentAttachment?.previewUrl;

    const tempMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId: activeConvId,
      senderId: me?.id ?? "me",
      content: displayContent,
      imageUrl: attachmentUrl,
      attachments: currentAttachment
        ? [
            {
              type: "image",
              url: currentAttachment.previewUrl,
              name: currentAttachment.name,
              size: currentAttachment.size,
            },
          ]
        : undefined,
      createdAt: new Date().toISOString(),
    };

    setSentMessages((prev) => [...prev, tempMsg]);

    try {
      await sendViaSocket(displayContent, {
        imageUrl: attachmentUrl,
        attachments: tempMsg.attachments,
      });
    } catch {
      // handled
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Chat Real-Time
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Komunikasi langsung dengan calon mitra dan partner bisnis.
        </p>
      </div>

      <div className="flex h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Left column: Conversation list */}
        <div className="flex w-80 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari percakapan…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isConvsLoading && (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
              </div>
            )}

            {!isConvsLoading && filteredConversations.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {targetOppId ? (
                  <div className="space-y-2">
                    <p>Memulai percakapan untuk Opportunity #{targetOppId.slice(0, 8)}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(`conv_${targetOppId}`)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Buka Chat Room
                    </button>
                  </div>
                ) : (
                  <p>Belum ada percakapan aktif. Temukan partner di Marketplace untuk mulai chat.</p>
                )}
              </div>
            )}

            {filteredConversations.map((conv) => {
              const active = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`flex w-full items-start gap-3 border-b border-zinc-50 p-3.5 text-left transition dark:border-zinc-800/60 ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {conv.originType} Chat
                      </span>
                      <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        {conv.originType}
                      </span>
                    </div>
                    {conv.opportunityId && (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        Opp: {conv.opportunityId.slice(0, 12)}…
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                      {conv.lastMessage?.content ?? "Percakapan baru"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Active Chat Window */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative flex flex-1 flex-col bg-zinc-50/50 dark:bg-zinc-950/30"
        >
          {/* Drag-over overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-40 m-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-600/10 backdrop-blur-xs">
              <div className="rounded-2xl bg-white p-4 text-center shadow-xl dark:bg-zinc-900">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Lepaskan foto di sini untuk melampirkan
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Foto akan ditambahkan ke pesan obrolan
                </p>
              </div>
            </div>
          )}

          {activeConvId ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Room {activeConvId.slice(0, 12)}
                    </h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tipe: {activeConv?.originType ?? "NEED"} · Socket.IO Terhubung
                    </p>
                  </div>
                </div>

                {activeConv?.opportunityId && (
                  <Link
                    href={`/opportunities/${activeConv.opportunityId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Briefcase className="h-3 w-3" />
                    Lihat Opportunity
                  </Link>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {isMsgLoading && (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
                  </div>
                )}

                {allMessages.length === 0 && !isMsgLoading && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Sparkles className="h-8 w-8 text-zinc-400" />
                    <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Mulai Percakapan
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Kirim salam pembuka untuk berdiskusi mengenai kebutuhan atau penawaran bisnis.
                    </p>
                  </div>
                )}

                {allMessages.map((msg) => {
                  const isMe = msg.senderId === me?.id || msg.senderId === "me";
                  const msgReactions = reactionsMap[msg.id] || msg.reactions;
                  const hasImage = Boolean(msg.imageUrl || (msg.attachments && msg.attachments.length > 0));

                  return (
                    <div
                      key={msg.id}
                      className={`group relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Message Bubble + Reaction trigger on hover */}
                      <div
                        className={`flex items-center gap-1.5 ${
                          isMe ? "flex-row" : "flex-row-reverse"
                        }`}
                      >
                        <MessageReactionTrigger
                          isMe={isMe}
                          onClick={() =>
                            setActivePickerMsgId((prev) => (prev === msg.id ? null : msg.id))
                          }
                        />
                        <div
                          className={`max-w-md overflow-hidden rounded-2xl text-sm ${
                            isMe
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          } ${hasImage ? "p-1.5" : "px-4 py-2.5"}`}
                        >
                          {/* Image Thumbnail */}
                          {hasImage && (
                            <ChatImageThumb
                              src={msg.imageUrl || msg.attachments?.[0]?.url || ""}
                              alt={msg.content}
                              onOpen={(url) =>
                                setLightboxImage({
                                  url,
                                  caption:
                                    msg.content && msg.content !== "📷 Foto"
                                      ? msg.content
                                      : undefined,
                                })
                              }
                            />
                          )}

                          {/* Text Content */}
                          {(!hasImage || (msg.content && msg.content !== "📷 Foto")) && (
                            <p
                              className={`whitespace-pre-wrap ${
                                hasImage ? "px-2 py-1.5 text-xs" : ""
                              }`}
                            >
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reaction counts shown below the message bubble */}
                      <MessageReactions
                        messageId={msg.id}
                        reactions={msgReactions}
                        currentUserId={me?.id || "me"}
                        isMe={isMe}
                        onToggleReaction={handleToggleReaction}
                        forcePickerOpen={activePickerMsgId === msg.id}
                        onClosePicker={() => setActivePickerMsgId(null)}
                      />

                      <span className="mt-1 px-1 text-[10px] text-zinc-400">
                        {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}

                {/* Typing indicator bubble */}
                {isTyping && (
                  <div className="flex flex-col items-start animate-fadeIn">
                    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s] dark:bg-zinc-500" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s] dark:bg-zinc-500" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {typingUser?.userName ? `${typingUser.userName} sedang mengetik…` : "Partner sedang mengetik…"}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Pending image preview */}
              {pendingAttachment && (
                <AttachmentPreview
                  previewUrl={pendingAttachment.previewUrl}
                  fileName={pendingAttachment.name}
                  fileSize={pendingAttachment.size}
                  onRemove={() => setPendingAttachment(null)}
                />
              )}

              {/* Chat Input */}
              <form
                onSubmit={handleSend}
                className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <ChatAttachmentMenu
                    onSelectImage={(attachment) => setPendingAttachment(attachment)}
                  />
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                    placeholder={
                      pendingAttachment
                        ? "Tambahkan keterangan foto (opsional)..."
                        : "Ketik pesan..."
                    }
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none ring-zinc-900 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !pendingAttachment}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>

            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-zinc-500">
              <MessageSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Pilih percakapan
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Pilih salah satu ruang obrolan di sebelah kiri untuk melihat pesan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox dialog for viewing images in full size */}
      <ImageLightbox
        imageUrl={lightboxImage?.url ?? null}
        caption={lightboxImage?.caption}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
