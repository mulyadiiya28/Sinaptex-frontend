'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  const statusCode = searchParams.get('status_code');

  const isSuccess = transactionStatus === 'settlement' || transactionStatus === 'capture';
  const isPending = transactionStatus === 'pending';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderId) {
        router.replace(`/marketplace/orders/${orderId}`);
      } else {
        router.replace('/marketplace/orders');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [orderId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-8 text-center shadow-sm">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSuccess ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-red-100'
          }`}
        >
          <span className="text-3xl">
            {isSuccess ? '✓' : isPending ? '⏳' : '✕'}
          </span>
        </div>

        <h1 className="text-2xl font-black text-[#0B2F6E]">
          {isSuccess
            ? 'Pembayaran Berhasil'
            : isPending
              ? 'Pembayaran Diproses'
              : 'Pembayaran Gagal'}
        </h1>

        <p className="mt-3 text-sm text-zinc-600">
          {isSuccess
            ? 'Terima kasih, pesanan Anda sedang diproses.'
            : isPending
              ? 'Silakan selesaikan pembayaran sesuai instruksi.'
              : 'Pembayaran tidak berhasil. Silakan coba lagi.'}
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
            <div className="text-xs text-zinc-500">Order ID</div>
            <div className="font-mono text-sm text-zinc-900 break-all">{orderId}</div>
            {statusCode && (
              <>
                <div className="text-xs text-zinc-500 mt-2">Status Code</div>
                <div className="font-mono text-sm text-zinc-900">{statusCode}</div>
              </>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Mengalihkan ke halaman pesanan...
        </p>

        <button
          onClick={() =>
            router.replace(orderId ? `/marketplace/orders/${orderId}` : '/marketplace/orders')
          }
          className="mt-4 w-full rounded-lg bg-[#0B2F6E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#082352] transition"
        >
          Lihat Pesanan Sekarang
        </button>
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