"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Product } from "@/features/marketplace/product/product.schema";
import { useCreateInquiry } from "@/features/marketplace/inquiry/inquiry.hooks";
import { useSessionStore } from "@/store/use-session-store";
import Link from "next/link";

interface ProductActionsProps {
  product: Product;
}

// Cart & checkout dinonaktifkan per Checklist Fase 1.1 — Sinaptex pivot ke
// platform matching tanpa menahan dana transaksi. Semua produk (baik
// INQUIRY_FIRST maupun GOODS/SERVICE_DIRECT sebelumnya) sekarang lewat satu
// alur yang sama: Ajukan Inquiry → Chat → Deal.
export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const [quantity, setQuantity] = useState(1);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [showInquiry, setShowInquiry] = useState(false);

  const createInquiry = useCreateInquiry(product.id);

  const isLoggedIn = Boolean(me);

  const handleInquiry = async () => {
    if (!isLoggedIn) return;
    try {
      const inquiry = await createInquiry.mutateAsync({
        message: inquiryMessage || undefined,
        proposedQuantity: quantity,
      });
      setShowInquiry(false);
      setInquiryMessage("");
      // Fase 2.1 — langsung ke percakapan chat yang otomatis dibuat backend,
      // supaya buyer bisa lanjut ngobrol dengan provider tanpa langkah tambahan.
      if (inquiry.conversationId) {
        router.push(`/chat?conversationId=${inquiry.conversationId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Kalau belum login
  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <Link
          href={`/login?redirect=${encodeURIComponent(`/marketplace/products/${product.id}`)}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#082352]"
        >
          Masuk untuk Mengajukan Inquiry
        </Link>
        <p className="text-center text-xs text-zinc-500">
          Anda perlu login untuk mengajukan inquiry ke penjual/provider.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showInquiry ? (
        <button
          onClick={() => setShowInquiry(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#082352]"
        >
          <Send className="h-4 w-4" />
          Ajukan Inquiry
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Jumlah yang diminta
            </label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                +
              </button>
              <span className="text-xs text-zinc-500">/ {product.baseUnit}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Pesan (opsional)
            </label>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Ceritakan kebutuhan Anda..."
              rows={3}
              maxLength={1000}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInquiry(false)}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
            <button
              onClick={handleInquiry}
              disabled={createInquiry.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B2F6E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082352] disabled:opacity-50"
            >
              {createInquiry.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Kirim
            </button>
          </div>
        </div>
      )}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
        <MessageSquare className="h-4 w-4" />
        Chat Vendor
      </button>
    </div>
  );
}