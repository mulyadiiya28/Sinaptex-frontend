"use client";

import { useState } from "react";
import { ShieldOff, X, Loader2, UserCheck } from "lucide-react";
import { useListBlocked, useUnblockProfile } from "@/features/chat/chat.hooks";

interface BlockedListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BlockedListModal({ isOpen, onClose }: BlockedListModalProps) {
  const { data: blocked, isLoading } = useListBlocked(isOpen);
  const unblock = useUnblockProfile();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const handleUnblock = async (blockedProfileId: string) => {
    setUnblockingId(blockedProfileId);
    try {
      await unblock.mutateAsync(blockedProfileId);
    } catch (err) {
      console.error("Gagal unblock:", err);
    } finally {
      setUnblockingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Pengguna Diblokir
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}

          {!isLoading && (!blocked || blocked.length === 0) && (
            <div className="py-8 text-center">
              <ShieldOff className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Belum ada pengguna yang diblokir.
              </p>
            </div>
          )}

          {!isLoading && blocked && blocked.length > 0 && (
            <ul className="space-y-2">
              {blocked.map((item) => {
                const isUnblocking = unblockingId === item.blockedProfileId;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.blocked?.fullName?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.blocked?.fullName ?? item.blockedProfileId.slice(0, 12)}
                        </p>
                        {item.reason && (
                          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(item.blockedProfileId)}
                      disabled={isUnblocking}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {isUnblocking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      Buka Blokir
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}