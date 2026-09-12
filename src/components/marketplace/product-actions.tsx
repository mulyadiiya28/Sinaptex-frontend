"use client";

import { useState } from "react";
import { ShoppingCart, MessageSquare, Send, Loader2 } from "lucide-react";
import { Product } from "@/features/marketplace/product/product.schema";
import { useAddToCart } from "@/features/marketplace/cart/cart.hooks";
import { useCreateInquiry } from "@/features/marketplace/inquiry/inquiry.hooks";
import { useSessionStore } from "@/store/use-session-store";
import Link from "next/link";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const me = useSessionStore((s) => s.me);
  const [quantity, setQuantity] = useState(1);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [showInquiry, setShowInquiry] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const addToCart = useAddToCart();
  const createInquiry = useCreateInquiry(product.id);

  const isLoggedIn = Boolean(me);
  const isInquiryFirst = product.fulfillmentFlow === "INQUIRY_FIRST";

  const handleAddToCart = async () => {
    if (!isLoggedIn) return;
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity,
        unit: product.baseUnit,
      });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInquiry = async () => {
    if (!isLoggedIn) return;
    try {
      await createInquiry.mutateAsync({
        message: inquiryMessage || undefined,
        proposedQuantity: quantity,
      });
      setShowInquiry(false);
      setInquiryMessage("");
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
          Masuk untuk Membeli
        </Link>
        <p className="text-center text-xs text-zinc-500">
          Anda perlu login untuk menambah ke keranjang atau mengajukan inquiry
        </p>
      </div>
    );
  }

  // PROPERTY / INQUIRY_FIRST → hanya tombol Inquiry
  if (isInquiryFirst) {
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
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
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

  // GOODS / SERVICE DIRECT → tombol Add to Cart
  return (
    <div className="space-y-3">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Jumlah:
        </label>
        <div className="flex items-center gap-2">
          <button
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
            className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            +
          </button>
          <span className="text-xs text-zinc-500">/ {product.baseUnit}</span>
        </div>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={addToCart.isPending || product.stock <= 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#082352] disabled:opacity-50"
      >
        {addToCart.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {addSuccess ? "✓ Ditambahkan!" : "Tambah ke Keranjang"}
      </button>

      {/* Chat Vendor */}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
        <MessageSquare className="h-4 w-4" />
        Chat Vendor
      </button>

      {addSuccess && (
        <Link
          href="/marketplace/cart"
          className="block text-center text-xs font-semibold text-[#FF6B00] hover:underline"
        >
          Lihat Keranjang →
        </Link>
      )}
    </div>
  );
}