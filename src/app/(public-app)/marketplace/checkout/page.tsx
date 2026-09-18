"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

// Checkout dinonaktifkan per Checklist Fase 1.1 — Sinaptex pivot ke platform
// matching, tidak lagi memproses pembayaran/dana transaksi antar pengguna.
// Halaman ini sengaja TIDAK dihapus (supaya link/bookmark lama tidak 404) —
// langsung redirect ke /marketplace dengan pesan singkat.
export default function CheckoutDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/marketplace"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <CreditCard className="h-6 w-6 text-slate-400" />
      </div>
      <h1 className="text-xl font-black text-[#0B2F6E]">Checkout sudah tidak digunakan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Sinaptex tidak lagi memproses pembayaran di platform. Sepakati harga
        dan pengiriman langsung dengan penjual/provider lewat chat, lalu
        catat sebagai Deal. Anda akan diarahkan ke Marketplace sebentar lagi.
      </p>
      <a
        href="/marketplace"
        className="rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#082352]"
      >
        Ke Marketplace sekarang
      </a>
    </div>
  );
}
