"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Package, ArrowLeft, ShoppingCart } from "lucide-react";
import { useMyOrders, useMySales } from "@/features/marketplace/order/order.hooks";
import { OrderCard } from "@/components/marketplace/order-card";
import { useSessionStore } from "@/store/use-session-store";

type Tab = "purchases" | "sales";

export default function OrdersPage() {
  const me = useSessionStore((s) => s.me);
  const [tab, setTab] = useState<Tab>("purchases");

  const { data: purchases, isLoading: loadingPurchases } = useMyOrders(
    Boolean(me) && tab === "purchases"
  );
  const { data: sales, isLoading: loadingSales } = useMySales(
    Boolean(me) && tab === "sales"
  );

  const isLoading = tab === "purchases" ? loadingPurchases : loadingSales;
  const orders = tab === "purchases" ? purchases : sales;

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Masuk untuk Lihat Pesanan
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Anda perlu login untuk mengakses riwayat pesanan
        </p>
        <Link
          href="/login?redirect=/marketplace/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-6 py-3 text-sm font-bold text-white hover:bg-[#082352]"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

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
            Kembali ke Marketplace
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
            Pesanan Saya
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setTab("purchases")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === "purchases"
                ? "bg-[#0B2F6E] text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Pembelian
          </button>
          <button
            onClick={() => setTab("sales")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === "sales"
                ? "bg-[#0B2F6E] text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Penjualan
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!orders || orders.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
            {tab === "purchases" ? (
              <ShoppingCart className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            ) : (
              <Package className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            )}
            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {tab === "purchases"
                ? "Belum ada pembelian"
                : "Belum ada penjualan"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {tab === "purchases"
                ? "Mulai belanja di marketplace"
                : "Produk Anda akan muncul di sini saat ada yang beli"}
            </p>
            {tab === "purchases" && (
              <Link
                href="/marketplace"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#082352]"
              >
                Jelajahi Marketplace
              </Link>
            )}
          </div>
        )}

        {/* List */}
        {!isLoading && orders && orders.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant={tab === "purchases" ? "buyer" : "seller"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}