"use client";

import { useState } from "react";
import { ShieldOff, X, Loader2 } from "lucide-react";
import { useBlockProfile } from "@/features/chat/chat.hooks";

interface BlockButtonProps {
  targetProfileId: string;
  targetName?: string;
  onBlocked?: () => void;
}

export function BlockButton({ targetProfileId, targetName, onBlocked }: BlockButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const blockProfile = useBlockProfile();

  const handleBlock = async () => {
    try {
      await blockProfile.mutateAsync({
        blockedProfileId: targetProfileId,
        reason: reason.trim() || undefined,
      });
      setIsOpen(false);
      setReason("");
      onBlocked?.();
    } catch (err) {
      console.error("Gagal memblokir:", err);
    }
  };

  return (
    <>
      {/* Tombol Block */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        title="Blokir pengguna ini"
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Blokir
      </button>

      {/* Modal Konfirmasi */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Blokir {targetName ?? "Pengguna"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Setelah diblokir, mereka tidak akan bisa mengirim pesan baru ke Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Alasan (opsional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Misal: spam, penipuan, konten tidak pantas…"
                maxLength={500}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1 text-right text-[10px] text-zinc-400">
                {reason.length}/500
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={blockProfile.isPending}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blockProfile.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {blockProfile.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memproses…
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" />
                    Blokir
                  </>
                )}
              </button>
            </div>

            {blockProfile.isError && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                Gagal memblokir: {(blockProfile.error as Error)?.message ?? "Coba lagi"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}