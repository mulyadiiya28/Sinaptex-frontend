"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

// Keranjang & checkout dinonaktifkan per Checklist Fase 1.1 — Sinaptex
// pivot ke platform matching (Inquiry → Chat → Deal), tidak lagi menahan
// dana transaksi. Halaman ini sengaja TIDAK dihapus (supaya link/bookmark
// lama tidak 404) — langsung redirect ke /marketplace dengan pesan singkat.
export default function CartDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/marketplace"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <ShoppingCart className="h-6 w-6 text-slate-400" />
      </div>
      <h1 className="text-xl font-black text-[#0B2F6E]">Keranjang sudah tidak digunakan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Sinaptex sekarang berfokus pada pencocokan mitra bisnis: ajukan
        inquiry langsung dari halaman produk, lalu lanjutkan lewat chat dan
        deal dengan penjual/provider. Anda akan diarahkan ke Marketplace
        sebentar lagi.
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
