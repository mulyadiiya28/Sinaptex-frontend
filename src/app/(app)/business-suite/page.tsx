"use client";

import Link from "next/link";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ReceiptText,
  HandCoins,
  Boxes,
  Users,
  CheckSquare,
  CalendarDays,
  Landmark,
  ArrowRight,
  Construction,
  ClipboardList,
  Package,
} from "lucide-react";
import { useMyParties } from "@/features/party/party.hooks";
import { useBsDashboard } from "@/features/business-suite/dashboard.hooks";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1_000_000 ? "compact" : "standard",
  }).format(amount);
}

const modules: {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  ready: boolean;
}[] = [
  { href: "/business-suite/kas", label: "Kas", desc: "Catat pemasukan & pengeluaran", icon: Wallet, ready: true },
  {
    href: "/business-suite/transaksi",
    label: "Catat Transaksi",
    desc: "Penjualan/pembelian (auto ke Persediaan, Piutang/Hutang, Kas)",
    icon: ClipboardList,
    ready: true,
  },
  {
    href: "/business-suite/produk",
    label: "Produk / Barang",
    desc: "Katalog internal, opsional tampil di Marketplace",
    icon: Package,
    ready: true,
  },
  {
    href: "/business-suite/piutang",
    label: "Piutang",
    desc: "Tagihan yang harus diterima",
    icon: ReceiptText,
    ready: true,
  },
  {
    href: "/business-suite/hutang",
    label: "Hutang",
    desc: "Tagihan yang harus dibayar",
    icon: HandCoins,
    ready: true,
  },
  {
    href: "/business-suite/persediaan",
    label: "Persediaan",
    desc: "Stok barang & pergerakannya",
    icon: Boxes,
    ready: false,
  },
  { href: "/business-suite/kontak", label: "Kontak", desc: "Pelanggan, supplier, debitur", icon: Users, ready: true },
  { href: "/business-suite/tugas", label: "Tugas", desc: "To-do list bisnis", icon: CheckSquare, ready: false },
  {
    href: "/business-suite/agenda",
    label: "Agenda",
    desc: "Jadwal & pengingat",
    icon: CalendarDays,
    ready: false,
  },
  {
    href: "/business-suite/pinjaman",
    label: "Pinjaman / Koperasi",
    desc: "Pencairan & angsuran",
    icon: Landmark,
    ready: false,
  },
];

export default function BusinessSuitePage() {
  const { data: parties } = useMyParties();
  const primaryParty = parties?.[0];
  const { data: dashboard, isLoading } = useBsDashboard(primaryParty?.id ?? "");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0B2F6E] dark:text-blue-400">
          Business Suite
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Kelola keuangan, stok, dan operasional bisnis Anda dalam satu tempat.
        </p>
      </div>

      {!primaryParty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Anda belum punya Party (profil bisnis)
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Buat Party dulu di halaman Profil untuk memakai Business Suite.
          </p>
        </div>
      ) : (
        <>
          {/* Financial Summary */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Ringkasan Keuangan (30 hari terakhir)
            </h2>
            {isLoading ? (
              <p className="mt-3 text-sm text-zinc-500">Memuat…</p>
            ) : dashboard ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Saldo Kas</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {formatIDR(dashboard.financial.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Arus Kas Bersih</p>
                  <p
                    className={`mt-1 flex items-center gap-1 text-lg font-bold ${
                      dashboard.financial.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {dashboard.financial.netCashFlow >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {formatIDR(dashboard.financial.netCashFlow)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Piutang</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {formatIDR(dashboard.financial.totalReceivable)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Hutang</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {formatIDR(dashboard.financial.totalDebt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Data belum tersedia.</p>
            )}
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.ready ? m.href : "#"}
                  onClick={(e) => {
                    if (!m.ready) e.preventDefault();
                  }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                    m.ready
                      ? "border-slate-200/80 bg-white/90 hover:border-[#0B2F6E]/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                      : "cursor-not-allowed border-zinc-200 bg-zinc-50/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B2F6E] dark:bg-blue-950/40 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-50">
                      {m.label}
                      {!m.ready && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          <Construction className="h-2.5 w-2.5" />
                          Segera
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.desc}</p>
                  </div>
                  {m.ready && <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
