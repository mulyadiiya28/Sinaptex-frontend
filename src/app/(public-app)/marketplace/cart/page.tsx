"use client";

import Link from "next/link";
import { ShoppingCart, ArrowLeft, Trash2} from "lucide-react";
import { useCart, useClearCart } from "@/features/marketplace/cart/cart.hooks";
import { CartItem } from "@/components/marketplace/cart-item";
import { useSessionStore } from "@/store/use-session-store";

function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

export default function CartPage() {
  const me = useSessionStore((s) => s.me);
  const { data: cart, isLoading, error } = useCart(Boolean(me));
  const clearCart = useClearCart();

  const isLoggedIn = Boolean(me);

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Masuk untuk Melihat Keranjang
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Anda perlu login untuk mengakses keranjang belanja
        </p>
        <Link
          href="/login?redirect=/marketplace/cart"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );

  const handleClearCart = () => {
    if (confirm("Kosongkan semua item dari keranjang?")) {
      clearCart.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-[#0B2F6E] dark:text-zinc-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Lanjut Belanja
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Keranjang Belanja
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Gagal memuat keranjang
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
            <ShoppingCart className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Keranjang masih kosong
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Mulai belanja dengan mengunjungi marketplace
            </p>
            <Link
              href="/marketplace"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#082352]"
            >
              Jelajahi Marketplace
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {!isLoading && !error && items.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500">
                  {items.length} item di keranjang
                </p>
                <button
                  onClick={handleClearCart}
                  disabled={clearCart.isPending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Kosongkan
                </button>
              </div>

              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Ringkasan Pesanan
              </h2>

              <div className="mt-4 space-y-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal ({items.length} item)</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Total
                </span>
                <span className="text-lg font-black text-[#0B2F6E] dark:text-blue-400">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <Link
                href="/marketplace/checkout"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 transition hover:bg-orange-600"
              >
                Lanjut ke Checkout
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>

              <p className="mt-3 text-center text-[10px] text-zinc-400">
                Pembayaran aman via Midtrans
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}