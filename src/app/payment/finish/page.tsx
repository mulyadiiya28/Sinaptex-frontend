'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { apiClient } from '@/lib/api-client';

type OrderData = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount?: number;
};

const POLL_INTERVAL = 3000;
const MAX_POLL = 20;

const FINAL_STATUSES = ['PAID', 'CANCELLED', 'EXPIRED', 'COMPLETED'];

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const invoiceNumber = searchParams.get('order_id');
  const transactionStatusFromUrl = searchParams.get('transaction_status');

  const [orderUuid, setOrderUuid] = useState<string | null>(null);
  const [realStatus, setRealStatus] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  // Polling ke backend sampai status final
  useEffect(() => {
    if (!invoiceNumber) return;
    if (stopped) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const order = await apiClient.get<OrderData>(
          `/marketplace/orders/by-invoice/${invoiceNumber}`
        );

        if (cancelled) return;

        setOrderUuid(order.id);
        setRealStatus(order.status);

        if (FINAL_STATUSES.includes(order.status)) {
          setStopped(true);
          return;
        }

        setPollCount((c) => {
          const next = c + 1;
          if (next >= MAX_POLL) setStopped(true);
          return next;
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal cek status');
        }
      }
    };

    poll();
    const interval = setInterval(() => {
      if (stopped) {
        clearInterval(interval);
        return;
      }
      poll();
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [invoiceNumber, stopped]);

  // Auto-redirect setelah status final
  useEffect(() => {
    if (!realStatus || !orderUuid) return;
    if (!FINAL_STATUSES.includes(realStatus)) return;

    const timer = setTimeout(() => {
      router.replace(`/marketplace/orders/${orderUuid}`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [realStatus, orderUuid, router]);

  // Status display: pakai realStatus dari backend kalau ada, fallback ke URL hint
  const displayStatus =
    realStatus ??
    (transactionStatusFromUrl === 'settlement'
      ? 'PAID'
      : transactionStatusFromUrl === 'pending'
        ? 'PENDING_PAYMENT'
        : transactionStatusFromUrl === 'expire'
          ? 'EXPIRED'
          : transactionStatusFromUrl === 'deny' || transactionStatusFromUrl === 'cancel'
            ? 'CANCELLED'
            : 'PENDING_PAYMENT');

  const isSuccess = displayStatus === 'PAID' || displayStatus === 'COMPLETED';
  const isPending = displayStatus === 'PENDING_PAYMENT';
  const isFailed = displayStatus === 'CANCELLED' || displayStatus === 'EXPIRED';

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-8 text-center shadow-sm">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSuccess ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-red-100'
          }`}
        >
          <span className="text-3xl">{isSuccess ? '✓' : isPending ? '⏳' : '✕'}</span>
        </div>

        <h1 className="text-2xl font-black text-[#0B2F6E]">
          {isSuccess
            ? 'Pembayaran Berhasil'
            : isPending
              ? 'Menunggu Pembayaran'
              : 'Pembayaran Gagal'}
        </h1>

        <p className="mt-3 text-sm text-zinc-600">
          {isSuccess
            ? 'Terima kasih, pesanan Anda sedang diproses.'
            : isPending
              ? 'Status pembayaran sedang diverifikasi. Mohon tunggu...'
              : 'Pembayaran tidak berhasil. Silakan coba lagi.'}
        </p>

        {invoiceNumber && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
            <div className="text-xs text-zinc-500">Invoice</div>
            <div className="font-mono text-sm text-zinc-900 break-all">{invoiceNumber}</div>
            {realStatus && (
              <>
                <div className="text-xs text-zinc-500 mt-2">Status</div>
                <div className="font-mono text-sm text-zinc-900">{realStatus}</div>
              </>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

        {isPending && !stopped && (
          <p className="mt-6 text-xs text-zinc-400">
            Memverifikasi status pembayaran... ({pollCount}/{MAX_POLL})
          </p>
        )}

        {isPending && stopped && (
          <p className="mt-6 text-xs text-zinc-400">
            Verifikasi memakan waktu lebih lama. Silakan cek halaman pesanan nanti.
          </p>
        )}

        {(orderUuid || !isPending) && (
          <button
            onClick={() =>
              router.replace(
                orderUuid ? `/marketplace/orders/${orderUuid}` : '/marketplace/orders'
              )
            }
            className="mt-4 w-full rounded-lg bg-[#0B2F6E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#082352] transition"
          >
            {orderUuid ? 'Lihat Pesanan Sekarang' : 'Kembali ke Daftar Pesanan'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentFinishPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <PaymentFinishContent />
    </Suspense>
  );
}