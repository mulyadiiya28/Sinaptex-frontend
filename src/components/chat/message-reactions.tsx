"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Smile, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { ReactionRecord } from "@/features/chat/chat.schema";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "👏", "💡", "🤝", "🚀", "😂"];
const EXTENDED_EMOJIS = ["🎉", "✨", "💯", "🙏", "👀", "✅", "💼", "📈", "💪", "🎯", "🙌", "🤩"];

interface MessageReactionsProps {
  messageId: string;
  reactions?: ReactionRecord;
  currentUserId: string;
  isMe: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  forcePickerOpen?: boolean;
  onClosePicker?: () => void;
}

export function MessageReactions({
  messageId,
  reactions = {},
  currentUserId,
  isMe,
  onToggleReaction,
  forcePickerOpen = false,
  onClosePicker,
}: MessageReactionsProps) {
  const [internalPicker, setInternalPicker] = useState(false);
  const showPicker = internalPicker || forcePickerOpen;
  const [showExtended, setShowExtended] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePicker = useCallback(() => {
    setInternalPicker(false);
    setShowExtended(false);
    onClosePicker?.();
  }, [onClosePicker]);

  // Close picker when clicking outside or pressing Escape
  useEffect(() => {
    if (!showPicker) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closePicker();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePicker();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPicker, closePicker]);

  // Aggregate reactions list: only emojis with count > 0
  const activeReactions = useMemo(() => {
    return Object.entries(reactions)
      .map(([emoji, users]) => ({
        emoji,
        users: Array.isArray(users) ? users : [],
        count: Array.isArray(users) ? users.length : 0,
        hasReacted: Array.isArray(users) ? users.includes(currentUserId) : false,
      }))
      .filter((r) => r.count > 0);
  }, [reactions, currentUserId]);

  const handleSelectEmoji = (emoji: string) => {
    onToggleReaction(messageId, emoji);
    closePicker();
  };

  return (
    <div className={`relative mt-1 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      {/* Reaction Picker Popover */}
      {showPicker && (
        <div
          ref={pickerRef}
          className={`absolute bottom-full z-30 mb-2 w-max max-w-[280px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10 ${
            isMe ? "right-0" : "left-0"
          }`}
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          {/* Quick Bar */}
          <div className="flex items-center gap-1">
            {QUICK_EMOJIS.map((emoji) => {
              const isSelected = reactions[emoji]?.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectEmoji(emoji)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-lg transition hover:scale-125 active:scale-95 ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-950/70 ring-1 ring-blue-500"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowExtended((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title={showExtended ? "Sembunyikan emoji lainnya" : "Emoji lainnya"}
            >
              {showExtended ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Extended Grid */}
          {showExtended && (
            <div className="mt-2 grid grid-cols-6 gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
              {EXTENDED_EMOJIS.map((emoji) => {
                const isSelected = reactions[emoji]?.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-lg transition hover:scale-125 active:scale-95 ${
                      isSelected
                        ? "bg-blue-100 dark:bg-blue-950/70 ring-1 ring-blue-500"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reaction Badges Container directly below the message bubble */}
      <div className={`flex flex-wrap items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
        {/* Render badges for emojis that have reactions */}
        {activeReactions.map((item) => {
          return (
            <button
              key={item.emoji}
              type="button"
              onClick={() => onToggleReaction(messageId, item.emoji)}
              title={
                item.hasReacted
                  ? `Anda dan ${item.count - 1} lainnya bereaksi ${item.emoji}`
                  : `${item.count} orang bereaksi ${item.emoji}`
              }
              className={`group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                item.hasReacted
                  ? "border border-blue-400/80 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-400/20 dark:border-blue-500/50 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-sm leading-none">{item.emoji}</span>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  item.hasReacted ? "text-blue-700 dark:text-blue-300" : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}

        {/* Small "Add Reaction" button next to badges or when badges exist */}
        {activeReactions.length > 0 && (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setInternalPicker((prev) => !prev)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white/80 text-zinc-400 opacity-80 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 hover:opacity-100 active:scale-90 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            title="Tambah reaksi"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Quick trigger icon button that hovers beside the message bubble to open the reaction picker.
 */
export function MessageReactionTrigger({
  onClick,
  isMe,
}: {
  onClick: () => void;
  isMe: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-xs opacity-0 transition-all group-hover:opacity-100 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 ${
        isMe ? "mr-1.5" : "ml-1.5"
      }`}
      title="Beri reaksi emoji"
    >
      <Smile className="h-3.5 w-3.5" />
    </button>
  );
}
