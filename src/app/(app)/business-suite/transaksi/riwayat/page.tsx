"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, Truck, FileText } from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import { useBusinessTransactions } from "@/features/business-suite/businessTransaction/businessTransaction.hooks";
import { TransactionType, PaymentStatus } from "@/features/business-suite/businessTransaction/businessTransaction.schema";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusBadge: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  UNPAID: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const statusLabel: Record<PaymentStatus, string> = {
  PAID: "Lunas",
  PARTIAL: "Sebagian",
  UNPAID: "Belum Bayar",
};

export default function RiwayatTransaksiPage() {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];
  const partyId = primaryParty?.id ?? "";

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<TransactionType | "">("");

  const { data, isLoading, error } = useBusinessTransactions(partyId, {
    page,
    limit: 20,
    type: filterType || undefined,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/business-suite"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Business Suite
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
              Riwayat Transaksi
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Semua penjualan & pembelian yang sudah dicatat.
            </p>
          </div>
          <Link
            href="/business-suite/transaksi"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#082352]"
          >
            Catat Transaksi Baru
          </Link>
        </div>
      </div>

      {!primaryParty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {[
              { label: "Semua", value: "" as const },
              { label: "Penjualan", value: "SALE" as const },
              { label: "Pembelian", value: "PURCHASE" as const },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setFilterType(f.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  filterType === f.value
                    ? "bg-[#0B2F6E] text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-zinc-500">Memuat riwayat transaksi…</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              Gagal memuat riwayat transaksi.
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
              <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Catat penjualan/pembelian pertama Anda.
              </p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="space-y-2">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          t.type === "SALE"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                            : "bg-orange-50 text-[#FF6B00] dark:bg-orange-950/30"
                        }`}
                      >
                        {t.type === "SALE" ? (
                          <ShoppingBag className="h-5 w-5" />
                        ) : (
                          <Truck className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {t.type === "SALE" ? "Penjualan" : "Pembelian"} — {t.contact?.name ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(t.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {t.referenceNo ? ` · ${t.referenceNo}` : ""} · {t.items.length} item
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatIDR(t.totalAmount)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[t.paymentStatus]}`}
                      >
                        {statusLabel[t.paymentStatus]}
                      </span>
                    </div>
                  </div>
                  {t.items.length > 0 && (
                    <div className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      {t.items.map((i) => (
                        <div key={i.id ?? `${i.productId}-${i.qty}`} className="flex justify-between py-0.5">
                          <span>
                            {i.product?.name ?? i.productId} × {i.qty}
                          </span>
                          <span>{formatIDR(i.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-700"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-zinc-500">
                {page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-700"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
