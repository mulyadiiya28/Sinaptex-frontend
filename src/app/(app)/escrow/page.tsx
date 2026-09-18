"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

// Modul Escrow dinonaktifkan per Checklist Fase 1.1 — Sinaptex pivot ke
// platform matching, tidak lagi menahan dana pembeli/penjual. Halaman ini
// sengaja TIDAK dihapus (supaya link/bookmark lama tidak 404) — langsung
// redirect ke /dashboard dengan pesan singkat.
export default function EscrowDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <ShieldCheck className="h-6 w-6 text-slate-400" />
      </div>
      <h1 className="text-xl font-black text-[#0B2F6E]">Escrow sudah tidak digunakan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Sinaptex tidak lagi menahan dana transaksi. Pembayaran diatur
        langsung antara kedua pihak sesuai kesepakatan (Deal) yang dibuat
        lewat chat. Anda akan diarahkan ke Dashboard sebentar lagi.
      </p>
      <a
        href="/dashboard"
        className="rounded-xl bg-[#0B2F6E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#082352]"
      >
        Ke Dashboard sekarang
      </a>
    </div>
  );
}
