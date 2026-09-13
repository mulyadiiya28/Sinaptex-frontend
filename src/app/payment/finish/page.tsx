'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  Receipt,
  RefreshCw,
} from 'lucide-react';

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
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (!invoiceNumber || stopped) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const order = await apiClient.get<OrderData>(
          `/marketplace/orders/by-invoice/${invoiceNumber}`
        );
        if (cancelled) return;

        setOrderUuid(order.id);
        setRealStatus(order.status);
        setTotalAmount(order.totalAmount ?? null);

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal cek status');
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

  useEffect(() => {
    if (!realStatus || !orderUuid) return;
    if (!FINAL_STATUSES.includes(realStatus)) return;
    if (realStatus === 'CANCELLED' || realStatus === 'EXPIRED') return;

    const timer = setTimeout(() => {
      router.replace(`/marketplace/orders/${orderUuid}`);
    }, 4000);
    return () => clearTimeout(timer);
  }, [realStatus, orderUuid, router]);

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

  const config = isSuccess
    ? {
        accent: '#10b981',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        icon: CheckCircle2,
        title: 'Pembayaran Berhasil',
        subtitle: 'Terima kasih, pesanan Anda sedang kami proses.',
        badgeText: 'BERHASIL',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    : isPending
      ? {
          accent: '#0B2F6E',
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          icon: Clock,
          title: 'Menunggu Pembayaran',
          subtitle: 'Status pembayaran sedang diverifikasi. Mohon tunggu.',
          badgeText: 'PENDING',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        }
      : {
          accent: '#ef4444',
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          icon: XCircle,
          title: 'Pembayaran Gagal',
          subtitle: 'Pembayaran tidak berhasil. Silakan coba lagi.',
          badgeText: 'GAGAL',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        {/* Main card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-8 shadow-sm">
          {/* Badge */}
          <div className="flex justify-center">
            <span
              className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest ${config.badgeClass}`}
            >
              {config.badgeText}
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mt-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${config.iconBg}`}
            >
              {isPending && !stopped ? (
                <Loader2 className={`h-10 w-10 ${config.iconColor} animate-spin`} />
              ) : (
                <Icon className={`h-10 w-10 ${config.iconColor}`} />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-center text-2xl font-black text-[#0B2F6E]">
            {config.title}
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-600">{config.subtitle}</p>

          {/* Order details */}
          {invoiceNumber && (
            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Receipt className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Detail Pesanan
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                  Invoice
                </div>
                <div className="mt-1 font-mono text-sm text-zinc-900 break-all">
                  {invoiceNumber}
                </div>
              </div>

              {totalAmount !== null && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                    Total
                  </div>
                  <div className="mt-1 text-lg font-black text-[#0B2F6E]">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              {realStatus && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                    Status
                  </div>
                  <div className="mt-1 font-mono text-xs text-zinc-700">{realStatus}</div>
                </div>
              )}
            </div>
          )}

          {/* Polling indicator */}
          {isPending && !stopped && (
            <div className="mt-6 space-y-2">
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#0B2F6E] transition-all duration-500 rounded-full"
                  style={{ width: `${(pollCount / MAX_POLL) * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-zinc-400">
                Memverifikasi status pembayaran... ({pollCount}/{MAX_POLL})
              </p>
            </div>
          )}

          {isPending && stopped && (
            <p className="mt-6 text-center text-xs text-zinc-400">
              Verifikasi memakan waktu lebih lama. Silakan cek halaman pesanan nanti.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 space-y-2">
            {orderUuid ? (
              <button
                onClick={() => router.replace(`/marketplace/orders/${orderUuid}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#082352] transition"
              >
                Lihat Pesanan
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => router.replace('/marketplace/orders')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B2F6E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#082352] transition"
              >
                Kembali ke Pesanan
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {isFailed && (
              <button
                onClick={() => router.replace('/marketplace')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Halaman ini otomatis diperbarui. Jangan tutup browser Anda.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFinishPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
          <Loader2 className="h-8 w-8 text-[#0B2F6E] animate-spin" />
        </div>
      }
    >
      <PaymentFinishContent />
    </Suspense>
  );
}